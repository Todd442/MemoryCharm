import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

import { claimCharm, configureCharm, uploadCharm, getUserMe, saveProfile } from "../api";
import type { UserProfile } from "../api";
import { loginRequest } from "../../../app/auth/msalConfig";
import { useStatus } from "../../../app/providers/StatusProvider";
import { ALL_GLYPHS, type GlyphInfo } from "../../../app/data/glyphs";

import "./ClaimCharmPage.css";
import textInputBg from "../../../assets/textInput-background.png";

type Step = "loading" | "profile" | "configure" | "upload" | "done";
type MemoryType = "video" | "image" | "audio";
type AuthMode = "none" | "glyph";

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
  const [file, setFile] = useState<File | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);

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

  // Once authed, check whether this account already has a profile.
  // New accounts land on the profile step; existing accounts skip straight to configure.
  useEffect(() => {
    if (!isAuthed) return;

    // Pre-fill email from the MSAL account
    setProfileData((prev) => ({ ...prev, email: emailish }));

    getUserMe()
      .then((res) => {
        if (res.hasProfile) {
          setInitialStep("configure");
        } else {
          setInitialStep("profile");
        }
      })
      .catch((e: any) => {
        setErr(e?.message ?? "Failed to check profile.");
        setInitialStep("configure"); // fall back so the page isn't stuck
      });
  }, [isAuthed, emailish]);

  // Keep the top status bar in sync with the current step
  useEffect(() => {
    const titles: Record<Step, { text: string; subtitle: string }> = {
      loading:   { text: "Bind the Charm",      subtitle: "Bind thy name to the ledger, and the Mechanism shall remember." },
      profile:   { text: "Keeper Registration", subtitle: "Inscribe your details upon the ledger." },
      configure: { text: "Bind the Charm",      subtitle: "Bind thy name to the ledger, and the Mechanism shall remember." },
      upload:    { text: "Bind the Charm",      subtitle: "Attach a memory to seal the charm." },
      done:      { text: "Charm Sealed",        subtitle: "The Mechanism shall remember." },
    };
    setStatus(titles[step]);
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
      advanceTo("configure");
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

  async function doUpload() {
    setErr(null);
    if (!file) {
      setErr("Select a file to upload.");
      return;
    }
    setBusy(true);
    setUploadPct(0);
    try {
      await uploadCharm(code, file, file.type, setUploadPct);
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
    <div className="teClaimWrap">
      <div className="teClaimPanel">
        <div className="teClaimMeta">
          <span className="teClaimMetaLabel">Charm code</span>
          <span className="teClaimMetaValue">{code}</span>
        </div>

        {/* Auth banner */}
        <div className="teAuthBanner">
          {isAuthed ? (
            <div className="teAuthRow">
              <div className="teAuthLeft">
                <div className="teAuthKicker">Signed in</div>
                <div className="teAuthName">{displayName}</div>
                {emailish && <div className="teAuthEmail">{emailish}</div>}
              </div>
            </div>
          ) : (
            <div className="teAuthRow">
              <div className="teAuthLeft">
                <div className="teAuthKicker">You’ll need an account to claim this charm.</div>
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
          )}
        </div>

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
                {step === "loading" ? "…" : step === "profile" ? "REGISTRATION" : step === "configure" ? "CHARM CONFIGURATION" : step === "upload" ? "MEMORY UPLOAD" : "SEALED"}
              </div>
              <div className="teCardHeaderLine" />

              <div className="teStatusPill" role="status" aria-live="polite">
                <span className={"teStatusDot " + (busy ? "isBusy" : "isReady")} />
                <span className="teStatusText">
                  {busy ? "Mechanism Working" : "Secure Seal Engaged"}
                </span>
              </div>
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
                    <label key={key} className="teField">
                      <div className="teFieldLabel">{label}</div>
                      <div className="teField--bgWrap" style={{ backgroundImage: `url(${textInputBg})` }}>
                        <input
                          className="teFieldInput"
                          value={profileData[key]}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, [key]: e.target.value }))}
                          disabled={busy}
                          placeholder={placeholder}
                        />
                      </div>
                      {hint && <div className="teFieldHint">{hint}</div>}
                    </label>
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

            {/* STEP: CONFIGURE */}
            {step === "configure" && (
              <div className="teCardBody">
                <div className="teGrid">
                  <div>
                    <div className="teFieldLabel">Memory type</div>
                    <div className="tePills">
                      {(["video", "image", "audio"] as MemoryType[]).map((t) => (
                        <button
                          key={t}
                          className={"tePill " + (memoryType === t ? "isActive" : "")}
                          onClick={() => setMemoryType(t)}
                          disabled={busy}
                          type="button"
                        >
                          {t.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="teFieldLabel">Playback protection</div>
                    <div className="tePills">
                      <button
                        className={"tePill " + (authMode === "none" ? "isActive" : "")}
                        onClick={() => setAuthMode("none")}
                        disabled={busy}
                        type="button"
                      >
                        OPEN
                      </button>
                      <button
                        className={"tePill " + (authMode === "glyph" ? "isActive" : "")}
                        onClick={() => setAuthMode("glyph")}
                        disabled={busy}
                        type="button"
                      >
                        GLYPH LOCK
                      </button>
                    </div>

                  </div>

                  {authMode === "glyph" && (
                    <div>
                      <div className="teFieldLabel">Choose your secret glyph</div>
                      <div className="teHint" style={{ marginBottom: 8 }}>
                        Select the glyph that will unlock this charm's memory.
                      </div>
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
                            style={{ fontSize: 12, padding: "8px 4px" }}
                          >
                            {g.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="teActionsRow">
                    <button
                      className="teBtn teBtnPrimary teBtnWide"
                      onClick={doClaimAndConfigure}
                      disabled={busy || working || (authMode === "glyph" && !selectedGlyph)}
                      type="button"
                    >
                      {busy ? "Binding charm…" : "Claim & Continue"}
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
                    Select {memoryType} file
                  </div>

                  <div className="teRail">
                    <div className="teRailIcon" aria-hidden="true">&#x2726;</div>
                    <input
                      type="file"
                      accept={acceptTypes[memoryType]}
                      disabled={busy}
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      style={{ flex: 1, padding: "6px 0" }}
                    />
                  </div>
                  {file && (
                    <div className="teHint" style={{ marginTop: 4 }}>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
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
                    disabled={busy || working || !file}
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
