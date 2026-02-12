import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

import { claimCharm, configureCharm, uploadCharm, getUserMe, saveProfile } from "../api";
import type { UserProfile } from "../api";
import { entryByCode } from "../../playback/api";
import { loginRequest } from "../../../app/auth/msalConfig";
import { useStatus } from "../../../app/providers/StatusProvider";
import { ALL_GLYPHS } from "../../../app/data/glyphs";

import "./ClaimCharmPage.css";
import { ThemedInput } from "../../../components/ThemedInput";

type Step = "loading" | "profile" | "memoryType" | "protection" | "glyphSelect" | "upload" | "done";
type MemoryType = "video" | "image" | "audio";
type AuthMode = "none" | "glyph";

type StepMeta = {
  cardTitle: string;
  statusText: string;
  statusSubtitle: string;
  stickyTitle: string;
  stickyDesc: string;
};

const STEP_META: Record<Step, StepMeta> = {
  loading: {
    cardTitle: "\u2026",
    statusText: "Bind the Charm",
    statusSubtitle: "Bind thy name to the ledger, and the Mechanism shall remember.",
    stickyTitle: "",
    stickyDesc: "",
  },
  profile: {
    cardTitle: "REGISTRATION",
    statusText: "Keeper Registration",
    statusSubtitle: "Inscribe your details upon the ledger.",
    stickyTitle: "Register as Keeper",
    stickyDesc: "Inscribe your name and details upon the Mechanism\u2019s ledger. Only registered Keepers may bind memories to a charm.",
  },
  memoryType: {
    cardTitle: "MEMORY FORM",
    statusText: "Bind the Charm",
    statusSubtitle: "Choose the form this memory shall take.",
    stickyTitle: "What form shall this memory take?",
    stickyDesc: "Each charm holds a single memory. Choose whether it will be a moving picture, a still image, or a spoken word.",
  },
  protection: {
    cardTitle: "CHARM PROTECTION",
    statusText: "Bind the Charm",
    statusSubtitle: "Choose how this charm shall be guarded.",
    stickyTitle: "Choose how this charm shall be guarded",
    stickyDesc: "An open charm reveals its memory to anyone who touches it. A glyph-locked charm demands a secret sign before it will yield.",
  },
  glyphSelect: {
    cardTitle: "SECRET GLYPH",
    statusText: "Bind the Charm",
    statusSubtitle: "Select the glyph that will unseal this memory.",
    stickyTitle: "Select the secret glyph",
    stickyDesc: "This glyph will be the key to unseal your charm\u2019s memory. Choose wisely \u2014 only those who know the sign may unlock it.",
  },
  upload: {
    cardTitle: "MEMORY UPLOAD",
    statusText: "Bind the Charm",
    statusSubtitle: "Attach a memory to seal the charm.",
    stickyTitle: "Attach your memory",
    stickyDesc: "The charm is bound and configured. Now breathe life into it \u2014 upload the memory that the Mechanism will guard.",
  },
  done: {
    cardTitle: "SEALED",
    statusText: "Charm Sealed",
    statusSubtitle: "The Mechanism shall remember.",
    stickyTitle: "Your charm is sealed",
    stickyDesc: "The memory is bound and the Mechanism stands ready. Your charm now lives.",
  },
};

export function ClaimCharmPage() {
  const nav = useNavigate();
  const { code } = useParams<{ code: string }>();

  const { instance, accounts, inProgress } = useMsal();
  const { setStatus } = useStatus();

  const isAuthed = accounts.length > 0;
  const me = accounts[0] ?? null;

  const displayName = useMemo(() => me?.name ?? "Keeper", [me]);
  const emailish = useMemo(() => me?.username ?? "", [me]);

  const [step, setStep] = useState<Step>("loading");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<{ charmId: string } | null>(null);

  const [memoryType, setMemoryType] = useState<MemoryType>("video");
  const [authMode, setAuthMode] = useState<AuthMode>("none");

  const [selectedGlyph, setSelectedGlyph] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadPct, setUploadPct] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);

  // Dynamic step counter — adjusts when glyphSelect is included/excluded
  const orderedSteps = useMemo<Step[]>(() => {
    const base: Step[] = ["profile", "memoryType", "protection"];
    if (authMode === "glyph") base.push("glyphSelect");
    base.push("upload", "done");
    return base;
  }, [authMode]);

  const stepNumber = useMemo(() => {
    const idx = orderedSteps.indexOf(step);
    return idx >= 0 ? idx + 1 : null;
  }, [orderedSteps, step]);

  const totalSteps = orderedSteps.length;

  useEffect(() => {
    setFooterEl(document.getElementById("te-footer"));
  }, []);

  // History-backed step navigation ------------------------------------------
  // setInitialStep: the first real step after loading.  replaceState so that
  // browser-back from here leaves the claim flow entirely.
  function setInitialStep(s: Step) {
    setStep(s);
    window.history.replaceState({ step: s }, "");
  }

  // advanceTo: every subsequent step.  pushState so browser-back pops it off.
  function advanceTo(s: Step) {
    setStep(s);
    window.history.pushState({ step: s }, "");
  }

  function goBack() {
    window.history.back();
  }

  // Sync browser back-button with step state
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state?.step) {
        setStep(e.state.step as Step);
      } else {
        nav("/");
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [nav]);
  // ---------------------------------------------------------------------------

  const [profileData, setProfileData] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    address: "",
    email: "",
    cellNumber: "",
  });

  // Once authed, check whether the charm is already active (redirect to playback)
  // and whether this account already has a profile (skip profile step if so).
  useEffect(() => {
    if (!isAuthed || !code) return;

    // Pre-fill email from the MSAL account
    setProfileData((prev) => ({ ...prev, email: emailish }));

    Promise.all([getUserMe(), entryByCode(code)])
      .then(([profileRes, entry]) => {
        // If charm is already configured with content, go straight to playback
        if (entry.kind === "claimed" && entry.configured) {
          nav(`/c/${encodeURIComponent(code)}`, { replace: true });
          return;
        }

        if (profileRes.hasProfile) {
          setInitialStep("memoryType");
        } else {
          setInitialStep("profile");
        }
      })
      .catch((e: any) => {
        setErr(e?.message ?? "Failed to check profile.");
        setInitialStep("memoryType"); // fall back so the page isn't stuck
      });
  }, [isAuthed, emailish, code, nav]);

  // Keep the top status bar in sync with the current step
  useEffect(() => {
    const meta = STEP_META[step];
    setStatus({ text: meta.statusText, subtitle: meta.statusSubtitle });
  }, [step, setStatus]);

  if (!code) {
    return (
      <div className="teClaimWrap">
        <div className="teClaimPanel">
          <div className="teClaimHero">
            <h1>Claim this Charm</h1>
            <p className="teClaimSub">A charm code is required to bind a memory.</p>
          </div>

          <div className="teClaimError">
            Missing charm code.
          </div>

          <div className="teClaimFooter">
            <Link className="teLink" to="/">Home</Link>
          </div>
        </div>
      </div>
    );
  }

  async function doSignIn() {
    setErr(null);
    try {
      await instance.loginRedirect(loginRequest);
    } catch (e: any) {
      setErr(e?.message ?? "Sign-in failed.");
    }
  }

  async function doSignOut() {
    setErr(null);
    try {
      await instance.logoutRedirect();
    } catch (e: any) {
      setErr(e?.message ?? "Sign-out failed.");
    }
  }

  async function doEditProfile() {
    setErr(null);
    try {
      await instance.loginRedirect(loginRequest);
    } catch (e: any) {
      setErr(e?.message ?? "Unable to open profile editor.");
    }
  }

  async function doSaveProfile() {
    setErr(null);
    setBusy(true);
    try {
      await saveProfile(profileData);
      advanceTo("memoryType");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save profile.");
    } finally {
      setBusy(false);
    }
  }

  async function doSaveDraft() {
    setErr(null);
    setBusy(true);
    try {
      await saveProfile(profileData);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save draft.");
    } finally {
      setBusy(false);
    }
  }

  async function doClaimAndConfigure() {
    setErr(null);
    setBusy(true);
    try {
      const c = await claimCharm(code);
      setClaimed({ charmId: c.charmId });

      await configureCharm(code, memoryType, authMode, selectedGlyph ?? undefined);
      advanceTo("upload");
    } catch (e: any) {
      setErr(e?.message ?? "Claim/configure failed.");
    } finally {
      setBusy(false);
    }
  }

  const maxCharmMB = Number(import.meta.env.VITE_MAX_CHARM_SIZE_MB) || 40;
  const MAX_CHARM_BYTES = maxCharmMB * 1024 * 1024;

  async function doUpload() {
    setErr(null);
    if (files.length === 0) {
      setErr("Select a file to upload.");
      return;
    }
    const totalBytes = files.reduce((s, f) => s + f.size, 0);
    if (totalBytes > MAX_CHARM_BYTES) {
      setErr(`Total file size exceeds ${maxCharmMB} MB limit (${(totalBytes / 1024 / 1024).toFixed(1)} MB selected).`);
      return;
    }
    setBusy(true);
    setUploadPct(0);
    try {
      await uploadCharm(code, files, files[0].type, setUploadPct);
      advanceTo("done");
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const acceptTypes: Record<MemoryType, string> = {
    video: "video/mp4,video/webm,video/quicktime",
    image: "image/jpeg,image/png,image/gif,image/webp",
    audio: "audio/mpeg,audio/wav,audio/ogg,audio/aac",
  };

  const working = inProgress !== InteractionStatus.None;

  return (
    <>
    <div className="teClaimLayout">
      {/* Fixed instruction header — always visible, never scrolls */}
      {step !== "loading" && (
        <div className="teClaimInstructions">
          {stepNumber !== null && (
            <div className="teIlluminatedNum">{stepNumber}</div>
          )}
          <div className="teInstructionsText">
            {stepNumber !== null && (
              <div className="teStickyCounter">
                Step {stepNumber} of {totalSteps}
              </div>
            )}
            <div className="teStickyTitle">{STEP_META[step].stickyTitle}</div>
            <div className="teStickyDesc">{STEP_META[step].stickyDesc}</div>
          </div>
          <div className="teStatusPill" role="status" aria-live="polite">
            <span className={"teStatusDot " + (busy ? "isBusy" : "isReady")} />
            <span className="teStatusText">
              {busy ? "Working" : "Seal Engaged"}
            </span>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="teClaimScrollArea">
      <div className="teClaimWrap">
      <div className="teClaimPanel">
        {/* Auth banner — only when not signed in */}
        {!isAuthed && (
          <div className="teAuthBanner">
            <div className="teAuthRow">
              <div className="teAuthLeft">
                <div className="teAuthKicker">You'll need an account to claim this charm.</div>
                <div className="teAuthHint">Sign up or sign in with Entra External ID.</div>
              </div>

              <button
                className="teBtn teBtnPrimary"
                onClick={doSignIn}
                disabled={working}
              >
                {working ? "Working…" : "Sign in"}
              </button>
            </div>
          </div>
        )}

        {err && <div className="teClaimError">{err}</div>}

        {!isAuthed && (
          <div className="teClaimFooter">
            <Link className="teLink" to="/">Home</Link>
          </div>
        )}

        {isAuthed && (
          <div className="teCard">
            <div className="teCardHeader">
              <div className="teCardHeaderLine" />
              <div className="teCardHeaderTitle">
                {STEP_META[step].cardTitle}
              </div>
              <div className="teCardHeaderLine" />
            </div>

            {/* STEP: LOADING */}
            {step === "loading" && (
              <div className="teCardBody">
                <div className="teHint">Checking account…</div>
              </div>
            )}

            {/* STEP: PROFILE */}
            {step === "profile" && (
              <div className="teCardBody">
                <div className="teGrid">
                  {([
                    { key: "firstName"  as const, label: "Given Name",            placeholder: "e.g., Elowen",              hint: "" },
                    { key: "lastName"   as const, label: "Family Name",           placeholder: "e.g., Blackthorne",         hint: "" },
                    { key: "address"    as const, label: "Dwelling Place",        placeholder: "e.g., 12 Hollow Lane",     hint: "" },
                    { key: "email"      as const, label: "Signal Address (Email)",placeholder: "captain@trianglesend.com",  hint: "We'll send a seal-confirmation missive to this address." },
                    { key: "cellNumber" as const, label: "Cipher Line",           placeholder: "e.g., +1 555 012 3456",    hint: "" },
                  ] as const).map(({ key, label, placeholder, hint }) => (
                    <ThemedInput
                      key={key}
                      label={label}
                      value={profileData[key]}
                      onChange={(v) => setProfileData((prev) => ({ ...prev, [key]: v }))}
                      disabled={busy}
                      placeholder={placeholder}
                      hint={hint || undefined}
                    />
                  ))}

                  {/* Terms acceptance */}
                  <label className="teTermsRow">
                    <input
                      className="teTermsCheck"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      disabled={busy}
                    />
                    <span className="teTermsText">
                      I accept the <a href="#" onClick={(e) => e.preventDefault()}>Code of Conduct</a> and the <a href="#" onClick={(e) => e.preventDefault()}>Terms of Passage</a>.
                    </span>
                  </label>

                  {/* Save draft + seal */}
                  <div className="teBtnsRow">
                    <button
                      className="teBtn teBtnGhost"
                      onClick={doSaveDraft}
                      disabled={busy || !profileData.firstName.trim() || !profileData.lastName.trim() || !profileData.email.trim()}
                      type="button"
                    >
                      {busy ? "Saving…" : "Save Draft"}
                    </button>
                    <button
                      className="teBtn teBtnPrimary"
                      onClick={doSaveProfile}
                      disabled={busy || !termsAccepted || !profileData.firstName.trim() || !profileData.lastName.trim() || !profileData.email.trim()}
                      type="button"
                    >
                      {busy ? "Binding…" : "Seal & Continue"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: MEMORY TYPE */}
            {step === "memoryType" && (
              <div className="teCardBody">
                <div className="teGrid">
                  <div className="tePills" style={{ flexDirection: "column" }}>
                    {(["video", "image", "audio"] as MemoryType[]).map((t) => (
                      <button
                        key={t}
                        className={"tePill tePillLarge " + (memoryType === t ? "isActive" : "")}
                        onClick={() => setMemoryType(t)}
                        disabled={busy}
                        type="button"
                      >
                        <span className="tePillLabel">{t.toUpperCase()}</span>
                        <span className="tePillDesc">
                          {t === "video" ? "A moving picture, captured in time."
                            : t === "image" ? "A still frame, frozen forever."
                            : "A voice or melody, preserved in sound."}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="teActionsRow">
                    <button
                      className="teBtn teBtnPrimary teBtnWide"
                      onClick={() => advanceTo("protection")}
                      disabled={busy}
                      type="button"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: PROTECTION */}
            {step === "protection" && (
              <div className="teCardBody">
                <div className="teGrid">
                  <div className="tePills" style={{ flexDirection: "column" }}>
                    <button
                      className={"tePill tePillLarge " + (authMode === "none" ? "isActive" : "")}
                      onClick={() => setAuthMode("none")}
                      disabled={busy}
                      type="button"
                    >
                      <span className="tePillLabel">OPEN</span>
                      <span className="tePillDesc">Anyone who touches the charm may view the memory.</span>
                    </button>
                    <button
                      className={"tePill tePillLarge " + (authMode === "glyph" ? "isActive" : "")}
                      onClick={() => setAuthMode("glyph")}
                      disabled={busy}
                      type="button"
                    >
                      <span className="tePillLabel">GLYPH LOCK</span>
                      <span className="tePillDesc">A secret glyph must be entered to unseal the memory.</span>
                    </button>
                  </div>

                  <div className="teActionsRow">
                    <button
                      className="teBtn teBtnPrimary teBtnWide"
                      onClick={() => {
                        if (authMode === "glyph") {
                          advanceTo("glyphSelect");
                        } else {
                          doClaimAndConfigure();
                        }
                      }}
                      disabled={busy || working}
                      type="button"
                    >
                      {busy ? "Binding charm\u2026" : "Continue"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: GLYPH SELECT */}
            {step === "glyphSelect" && (
              <div className="teCardBody">
                <div className="teGrid">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6, minmax(52px, 1fr))",
                      gap: 8,
                      maxWidth: 420,
                    }}
                  >
                    {ALL_GLYPHS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        disabled={busy}
                        onClick={() => setSelectedGlyph(g.id)}
                        className={"tePill " + (selectedGlyph === g.id ? "isActive" : "")}
                        style={{ fontSize: "var(--fs-xs)", padding: "8px 4px" }}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>

                  <div className="teActionsRow">
                    <button
                      className="teBtn teBtnPrimary teBtnWide"
                      onClick={doClaimAndConfigure}
                      disabled={busy || working || !selectedGlyph}
                      type="button"
                    >
                      {busy ? "Binding charm\u2026" : "Claim & Continue"}
                    </button>

                    {claimed && (
                      <div className="teHint">
                        Claimed as: <strong>{claimed.charmId}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP: UPLOAD */}
            {step === "upload" && (
              <div className="teCardBody">
                <label className="teField">
                  <div className="teFieldLabel">
                    Select {memoryType} file{memoryType === "image" ? "(s)" : ""}
                  </div>

                  <div className="teRail">
                    <div className="teRailIcon" aria-hidden="true">&#x2726;</div>
                    <input
                      type="file"
                      accept={acceptTypes[memoryType]}
                      multiple={memoryType === "image"}
                      disabled={busy}
                      onChange={(e) => {
                        const selected = e.target.files;
                        setFiles(selected ? Array.from(selected) : []);
                      }}
                      style={{ flex: 1, padding: "6px 0" }}
                    />
                  </div>
                  {files.length === 1 && (
                    <div className="teHint" style={{ marginTop: 4 }}>
                      {files[0].name} ({(files[0].size / 1024 / 1024).toFixed(1)} MB)
                    </div>
                  )}
                  {files.length > 1 && (
                    <div className="teHint" style={{ marginTop: 4 }}>
                      {files.length} files ({(files.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)} MB total)
                    </div>
                  )}
                </label>

                {busy && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{
                      height: 6,
                      borderRadius: 3,
                      background: "rgba(0,0,0,0.1)",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${uploadPct}%`,
                        background: "rgba(60,60,60,0.85)",
                        transition: "width 0.2s",
                      }} />
                    </div>
                    <div className="teHint" style={{ marginTop: 4 }}>
                      {Math.round(uploadPct)}%
                    </div>
                  </div>
                )}

                <div className="teActionsRow">
                  <button
                    className="teBtn teBtnPrimary"
                    onClick={doUpload}
                    disabled={busy || working || files.length === 0}
                    type="button"
                  >
                    {busy ? "Uploading\u2026" : "Upload"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP: DONE */}
            {step === "done" && (
              <div className="teCardBody">
                <div className="teHint">
                  Your charm is claimed, configured, and has a memory attached.
                </div>

                <div className="tePills tePillsWrap">
                  <button
                    className="tePill"
                    onClick={() => nav(`/c/${encodeURIComponent(code)}`)}
                    type="button"
                  >
                    View Landing (/c/{code})
                  </button>

                  <button
                    className="tePill"
                    onClick={() => nav(`/c?Token=t:${encodeURIComponent(code)}`)}
                    type="button"
                  >
                    Simulate NFC (/c?Token=…)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="teClaimFooter">
          <Link className="teLink" to="/">Home</Link>
        </div>
      </div>
    </div>
    </div>{/* close teClaimScrollArea */}
    </div>{/* close teClaimLayout */}

    {/* Portal: auth actions into the frame footer */}
    {isAuthed && footerEl && createPortal(
      <div className="te-footerActions">
        {step !== "loading" && (
          <button
            className="teBtn teBtnSm teBtnGhost"
            onClick={goBack}
            type="button"
          >
            ← Back
          </button>
        )}
        <button
          className="teBtn teBtnSm teBtnGhost"
          onClick={doEditProfile}
          disabled={working}
        >
          Edit profile
        </button>
        <button
          className="teBtn teBtnSm teBtnGhost"
          onClick={doSignOut}
          disabled={working}
        >
          Sign out
        </button>
      </div>,
      footerEl
    )}
    </>
  );
}
