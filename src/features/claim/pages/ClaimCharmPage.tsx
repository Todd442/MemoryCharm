import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

import { claimCharm, configureCharm, uploadCharm, getUserMe, saveProfile } from "../api";
import type { UserProfile } from "../api";
import { CURRENT_TERMS_VERSION, isUlaCachedLocally, cacheUlaLocally, acceptTerms } from "../../../app/api/profileApi";
import { UlaContent } from "../../legal/components/UlaContent";
import { getUserCharms, getCharmDetail } from "../../account/api";
import { entryByCode } from "../../playback/api";
import { checkFileAudioCodec } from "../../playback/utils/codecDetection";
import { loginRequest } from "../../../app/auth/msalConfig";
import { useStatus } from "../../../app/providers/StatusProvider";
import { ALL_GLYPHS } from "../../../app/data/glyphs";

import "./ClaimCharmPage.css";
import { ThemedInput } from "../../../components/ThemedInput";
import { InfoPanel } from "../../../components/InfoPanel";

// ---------------------------------------------------------------------------
// Shared helper: counts words in a string
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
const MAX_DESC_WORDS = 35;
const MAX_NAME_CHARS = 100;

// Memory name + description fields reused in ClaimCharmPage and CharmDetailPage
export function MemoryDetailsFields({
  memoryName,
  memoryDescription,
  onNameChange,
  onDescChange,
  disabled,
}: {
  memoryName: string;
  memoryDescription: string;
  onNameChange: (v: string) => void;
  onDescChange: (v: string) => void;
  disabled?: boolean;
}) {
  const wordCount = countWords(memoryDescription);
  const descColor =
    wordCount > MAX_DESC_WORDS ? "#ff6a6a"
    : wordCount > 28 ? "#f5c842"
    : wordCount > 21 ? "#f5a623"
    : undefined;

  return (
    <>
      <ThemedInput
        label="Memory Name"
        value={memoryName}
        onChange={(v) => onNameChange(v.slice(0, MAX_NAME_CHARS))}
        disabled={disabled}
        placeholder="e.g., Summer Wedding 2023"
        hint={`${memoryName.length}/${MAX_NAME_CHARS} characters — optional`}
      />

      <div className="teField">
        <div className="teFieldLabel">Memory Description</div>
        <textarea
          className="teTextarea"
          value={memoryDescription}
          onChange={(e) => {
            const val = e.target.value;
            if (countWords(val) <= MAX_DESC_WORDS || val.length < memoryDescription.length) {
              onDescChange(val);
            }
          }}
          disabled={disabled}
          placeholder="e.g., The moment they said yes, right by the water…"
          rows={3}
          style={{ resize: "vertical" }}
        />
        <div
          className="teFieldHint"
          style={descColor ? { color: descColor } : undefined}
        >
          {wordCount} / {MAX_DESC_WORDS} words — keep it brief, optional
        </div>
      </div>
    </>
  );
}
// ---------------------------------------------------------------------------

type Step = "loading" | "welcome" | "ula" | "profile" | "memoryType" | "details" | "protection" | "glyphSelect" | "upload" | "done";
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
    statusText: "Prepare Your Charm",
    statusSubtitle: "We’re checking your account before you bind a memory.",
    stickyTitle: "",
    stickyDesc: "",
  },
  welcome: {
    cardTitle: "CLAIM THIS CHARM",
    statusText: "Claim this Charm",
    statusSubtitle: "Sign in to become this charm’s Keeper.",
    stickyTitle: "What to expect",
    stickyDesc: "Everything you need to claim this charm and seal your memory.",
  },
  ula: {
    cardTitle: "LICENSE AGREEMENT",
    statusText: "User License Agreement",
    statusSubtitle: "A one-time read-and-accept for your account.",
    stickyTitle: "Review and accept",
    stickyDesc: "This agreement covers how your memories are hosted and protected.",
  },
  details: {
    cardTitle: "MEMORY DETAILS",
    statusText: "Name Your Memory",
    statusSubtitle: "Give this memory a name and a brief description.",
    stickyTitle: "Name your memory",
    stickyDesc: "A name and description appear when someone views the charm. Both are optional.",
  },
  profile: {
    cardTitle: "REGISTRATION",
    statusText: "Keeper Registration",
    statusSubtitle: "Tell us who you are so this charm can be claimed.",
    stickyTitle: "Register as Keeper",
    stickyDesc: "Every charm has a Keeper — that's you. Share your details so we can link this charm to your account.",
  },
  memoryType: {
    cardTitle: "MEMORY TYPE",
    statusText: "Choose a Memory Type",
    statusSubtitle: "Pick the kind of memory this charm will hold.",
    stickyTitle: "What kind of memory is this?",
    stickyDesc: "Each charm holds one memory — a video, a photo, or an audio clip.",
  },
  protection: {
    cardTitle: "CHARM PROTECTION",
    statusText: "Choose Access",
    statusSubtitle: "Decide who can open this charm.",
    stickyTitle: "Choose how this charm is protected",
    stickyDesc: "Open charms play immediately. Glyph-locked charms require a secret symbol to view.",
  },
  glyphSelect: {
    cardTitle: "SECRET GLYPH",
    statusText: "Choose a Glyph",
    statusSubtitle: "Pick the symbol that unlocks the charm.",
    stickyTitle: "Select a secret glyph",
    stickyDesc: "This glyph is the key. Only people who know it can open the memory.",
  },
  upload: {
    cardTitle: "MEMORY UPLOAD",
    statusText: "Upload Your Memory",
    statusSubtitle: "Choose the file you want to bind to this charm.",
    stickyTitle: "Select your memory",
    stickyDesc: "Pick the video, image, or audio you want to seal into the charm.",
  },
  done: {
    cardTitle: "SEALED",
    statusText: "Charm Sealed",
    statusSubtitle: "Your memory is now bound to the charm.",
    stickyTitle: "Your charm is sealed",
    stickyDesc: "The memory is secure and ready to be shared.",
  },
};

export function ClaimCharmPage() {
  const nav = useNavigate();
  const { code } = useParams<{ code: string }>();

  const { instance, accounts, inProgress } = useMsal();
  const { setStatus } = useStatus();

  const isAuthed = accounts.length > 0;
  const me = accounts[0] ?? null;

  const emailish = useMemo(() => me?.username ?? "", [me]);

  const [step, setStep] = useState<Step>("welcome");
  // needsUla / needsProfile: pessimistic defaults so pre-auth step count is accurate for new users.
  // Updated after API call completes.
  const [needsUla, setNeedsUla] = useState(!isUlaCachedLocally());
  const [needsProfile, setNeedsProfile] = useState(true);
  const [apiChecked, setApiChecked] = useState(false);
  const [ulaAccepting, setUlaAccepting] = useState(false);
  const [ulaError, setUlaError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<{ charmId: string } | null>(null);

  const [memoryType, setMemoryType] = useState<MemoryType>("video");
  const [authMode, setAuthMode] = useState<AuthMode>("none");
  const [memoryName, setMemoryName] = useState("");
  const [memoryDescription, setMemoryDescription] = useState("");

  const [selectedGlyph, setSelectedGlyph] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadPct, setUploadPct] = useState(0);
  const [sealPhase, setSealPhase] = useState<"claim" | "configure" | "upload" | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const lastUploadedRef = useRef<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);

  // Scroll back to top whenever the step changes
  useEffect(() => {
    scrollAreaRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  // Dynamic step list — always starts with welcome, then ULA/profile only if needed.
  const orderedSteps = useMemo<Step[]>(() => {
    const base: Step[] = ["welcome"];
    if (needsUla) base.push("ula");
    if (needsProfile) base.push("profile");
    base.push("memoryType", "details", "upload", "protection");
    if (authMode === "glyph") base.push("glyphSelect");
    base.push("done");
    return base;
  }, [needsUla, needsProfile, authMode]);

  const stepNumber = useMemo(() => {
    const idx = orderedSteps.indexOf(step);
    return idx >= 0 ? idx + 1 : null;
  }, [orderedSteps, step]);

  const totalSteps = orderedSteps.length;

  useEffect(() => {
    setFooterEl(document.getElementById("te-footer"));
  }, []);

  // Create/revoke object URLs for content preview on done page
  useEffect(() => {
    setCarouselIdx(0);
    if (files.length > 0) {
      const urls = files.map((f) => URL.createObjectURL(f));
      setPreviewUrls(urls);
      return () => urls.forEach((u) => URL.revokeObjectURL(u));
    }
    setPreviewUrls([]);
  }, [files]);

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
      // If this charm was already sealed this session, any back navigation
      // should land on the charm's admin page, not loop into the claim flow.
      if (code && sessionStorage.getItem(`mc.sealed.${code}`) === "true") {
        nav(`/account/charms/${encodeURIComponent(code)}`, { replace: true });
        return;
      }
      if (e.state?.step) {
        setStep(e.state.step as Step);
      } else {
        nav(-1 as any);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [nav, code]);
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

    // Fast-path: charm was already sealed this session — skip API round-trip
    if (sessionStorage.getItem(`mc.sealed.${code}`) === "true") {
      nav(`/c/${encodeURIComponent(code)}`, { replace: true, state: { isOwner: true } });
      return;
    }

    // Pre-fill email from the MSAL account
    setProfileData((prev) => ({ ...prev, email: emailish }));

    // Show loading while we check — prevents a welcome flash for already-authed users
    setStep("loading");

    Promise.all([getUserMe(), entryByCode(code)])
      .then(([profileRes, entry]) => {
        // If charm is already configured with content, go straight to playback
        if (entry.kind === "claimed" && entry.configured) {
          nav(`/c/${encodeURIComponent(code)}`, { replace: true, state: { isOwner: true } });
          return;
        }

        // Determine what this user still needs to complete
        const ulaNeeded = !isUlaCachedLocally() && profileRes.termsVersion !== CURRENT_TERMS_VERSION;
        const profileNeeded = !profileRes.hasProfile;

        if (!ulaNeeded && profileRes.termsVersion === CURRENT_TERMS_VERSION) {
          cacheUlaLocally(); // server confirmed — warm the local cache
        }

        setNeedsUla(ulaNeeded);
        setNeedsProfile(profileNeeded);
        setApiChecked(true);

        // Always land on welcome so new users see the process overview before ULA/profile.
        // The welcome card routes to the right next step based on needsUla/needsProfile.
        setInitialStep("welcome");

        // Pre-select the glyph from the user's most recently claimed glyph charm
        getUserCharms()
          .then((charms) => {
            const glyphCharms = charms
              .filter((c) => c.authMode === "glyph")
              .sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());
            if (glyphCharms.length > 0) return getCharmDetail(glyphCharms[0].charmId);
            return null;
          })
          .then((detail) => {
            if (detail?.glyphId) setSelectedGlyph(detail.glyphId);
          })
          .catch(() => {}); // silently ignore — pre-selection is a nicety
      })
      .catch((e: any) => {
        setErr(e?.message ?? "Failed to check profile.");
        setApiChecked(true);
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
      // Store the claim path so AuthGuard can return here after login completes
      const returnTo = `/claim/${code}`;
      sessionStorage.setItem("mc.returnTo", returnTo);
      localStorage.setItem("mc.returnTo", returnTo);
      await instance.loginRedirect(loginRequest);
    } catch (e: any) {
      setErr(e?.message ?? "Sign-in failed.");
    }
  }

  async function doAcceptUla() {
    setUlaAccepting(true);
    setUlaError(null);
    try {
      await acceptTerms();
      setNeedsUla(false);
      advanceTo(needsProfile ? "profile" : "memoryType");
    } catch {
      setUlaError("Something went wrong. Please try again.");
    } finally {
      setUlaAccepting(false);
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


  const maxCharmMB = memoryType === "image"
    ? (Number(import.meta.env.VITE_MAX_IMAGE_SIZE_MB) || 40)
    : (Number(import.meta.env.VITE_MAX_CHARM_SIZE_MB) || 200);
  const MAX_CHARM_BYTES = maxCharmMB * 1024 * 1024;
  const MAX_IMAGE_FILES = 10;
  const [fileErr, setFileErr] = useState<string | null>(null);

  async function handleFileSelect(selected: FileList | null) {
    setFileErr(null);
    if (!selected || selected.length === 0) {
      setFiles([]);
      return;
    }
    let picked = Array.from(selected);

    if (memoryType === "image" && picked.length > MAX_IMAGE_FILES) {
      picked = picked.slice(0, MAX_IMAGE_FILES);
      setFileErr(`You can include up to ${MAX_IMAGE_FILES} photos. We kept the first ${MAX_IMAGE_FILES}.`);
    }

    const totalBytes = picked.reduce((s, f) => s + f.size, 0);
    if (totalBytes > MAX_CHARM_BYTES) {
      setFileErr(`Total file size exceeds ${maxCharmMB} MB (${(totalBytes / 1024 / 1024).toFixed(1)} MB selected). Try a shorter clip or smaller file.`);
      setFiles([]);
      return;
    }

    // Check audio codec for video files before committing to upload
    if (memoryType === "video" && picked[0]) {
      const codecResult = await checkFileAudioCodec(picked[0]);
      if (codecResult.ok === false) {
        setFileErr(
          "This video's audio format isn't supported by web browsers (codec: " +
          codecResult.codec +
          "). Please re-export or convert the video to MP4 with AAC audio and try again."
        );
        setFiles([]);
        return;
      }
    }

    setFiles(picked);
  }

  async function doSealCharm() {
    if (!code) return;
    setErr(null);
    if (files.length === 0) {
      setErr("Please go back and select a file first.");
      return;
    }
    const filesKey = files.map(f => `${f.name}:${f.size}:${f.lastModified}`).join("|");
    const needsUpload = lastUploadedRef.current !== filesKey;

    setBusy(true);
    setUploadPct(0);
    try {
      if (!claimed) {
        setSealPhase("claim");
        const c = await claimCharm(code);
        setClaimed({ charmId: c.charmId });
      }

      setSealPhase("configure");
      await configureCharm(
        code, memoryType, authMode, selectedGlyph ?? undefined,
        memoryName.trim() || undefined,
        memoryDescription.trim() || undefined
      );

      if (needsUpload) {
        setSealPhase("upload");
        await uploadCharm(code, files, files[0].type, setUploadPct);
        lastUploadedRef.current = filesKey;
      }

      advanceTo("done");
      if (code) sessionStorage.setItem(`mc.sealed.${code}`, "true");
    } catch (e: any) {
      setErr(e?.message ?? "Seal failed.");
    } finally {
      setBusy(false);
      setSealPhase(null);
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
            {/* Step counter hidden on welcome — the pills in the card body explain the flow */}
            {stepNumber !== null && step !== "welcome" && (
              <div className="teStickyCounter">
                Step {stepNumber} of {totalSteps}
              </div>
            )}
            <div className="teStickyTitle">
              {step === "welcome" && isAuthed && apiChecked
                ? "You're all set — let's continue"
                : STEP_META[step].stickyTitle}
            </div>
            <div className="teStickyDesc">
              {step === "welcome" && isAuthed && apiChecked
                ? "Your account is ready. Pick up where you left off."
                : STEP_META[step].stickyDesc}
            </div>
          </div>
          <div className="teStatusPill" role="status" aria-live="polite">
            <span className={"teStatusDot " + (busy ? "isBusy" : "isReady")} />
            <span className="teStatusText">
              {busy ? "Working" : "Ready"}
            </span>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="teClaimScrollArea" ref={scrollAreaRef}>
      <div className="teClaimWrap">
      <div className="teClaimPanel">
        <div className="teCard">
          <div className="teCardHeader">
            <div className="teCardHeaderLine" />
            <div className="teCardHeaderTitle">{STEP_META[step].cardTitle}</div>
            <div className="teCardHeaderLine" />
          </div>

          {/* STEP: LOADING */}
          {step === "loading" && (
            <div className="teCardBody">
              <div className="teHint">Checking your account…</div>
            </div>
          )}

          {/* STEP: WELCOME — pre-auth instructions or post-auth returning-user briefing */}
          {step === "welcome" && (
            <div className="teCardBody">
              <div className="teGrid">
                {!isAuthed ? (
                  <>
                    <p style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-label)",
                      opacity: 0.75,
                      lineHeight: 1.65,
                      margin: "0 0 4px",
                      textAlign: "center",
                    }}>
                      This charm is yours to claim. Here's what happens when you continue:
                    </p>

                    {[
                      { s: "STEP 1", label: "SIGN IN OR CREATE AN ACCOUNT", desc: "You'll need a Memory Charm account to become this charm's Keeper." },
                      { s: "STEP 2", label: "ACCEPT THE LICENSE AGREEMENT", desc: "A one-time acceptance. Takes about a minute to read." },
                      { s: "STEP 3", label: "BIND YOUR MEMORY",             desc: "Upload a video, a photo, or an audio clip to seal inside this charm." },
                      { s: "STEP 4", label: "YOUR CHARM IS SEALED",         desc: "The memory is locked in and ready to share — forever." },
                    ].map(({ s, label, desc }) => (
                      <div
                        key={s}
                        className="tePill tePillLarge"
                        style={{ cursor: "default", pointerEvents: "none" }}
                      >
                        <span className="tePillSpec">{s}</span>
                        <span className="tePillLabel">{label}</span>
                        <span className="tePillDesc">{desc}</span>
                      </div>
                    ))}

                    {err && <div className="teClaimError">{err}</div>}

                    <div className="teActionsRow">
                      <button
                        className="teBtn teBtnPrimary teBtnWide"
                        onClick={doSignIn}
                        disabled={working}
                        type="button"
                      >
                        {working ? "Working…" : "Claim this Charm"}
                      </button>
                    </div>
                  </>
                ) : needsUla || needsProfile ? (
                  /* New user: just signed in, still needs ULA and/or profile */
                  <>
                    <p style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-label)",
                      opacity: 0.75,
                      lineHeight: 1.65,
                      margin: "0 0 4px",
                      textAlign: "center",
                    }}>
                      You're signed in. Here's what comes next:
                    </p>

                    {([
                      needsUla    && { s: "STEP 1", label: "REVIEW THE LICENSE AGREEMENT", desc: "A one-time acceptance. Takes about a minute to read." },
                      needsProfile && { s: needsUla ? "STEP 2" : "STEP 1", label: "COMPLETE YOUR REGISTRATION", desc: "Your name, email, address, and phone — so this charm is linked to you." },
                      { s: needsUla && needsProfile ? "STEP 3" : needsUla || needsProfile ? "STEP 2" : "STEP 1", label: "BIND YOUR MEMORY", desc: "Upload the video, photo, or audio clip to seal inside this charm." },
                      { s: needsUla && needsProfile ? "STEP 4" : needsUla || needsProfile ? "STEP 3" : "STEP 2", label: "YOUR CHARM IS SEALED",  desc: "The memory is locked in and ready to share." },
                    ] as const).filter(Boolean).map((item) => {
                      const { s, label, desc } = item as { s: string; label: string; desc: string };
                      return (
                        <div key={label} className="tePill tePillLarge" style={{ cursor: "default", pointerEvents: "none" }}>
                          <span className="tePillSpec">{s}</span>
                          <span className="tePillLabel">{label}</span>
                          <span className="tePillDesc">{desc}</span>
                        </div>
                      );
                    })}

                    {err && <div className="teClaimError">{err}</div>}

                    <div className="teActionsRow">
                      <button
                        className="teBtn teBtnPrimary teBtnWide"
                        onClick={() => advanceTo(needsUla ? "ula" : needsProfile ? "profile" : "memoryType")}
                        disabled={busy || !apiChecked}
                        type="button"
                      >
                        {!apiChecked ? "One moment…" : "Let's Begin"}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Returning user: ULA and profile already on file */
                  <>
                    <p style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-label)",
                      opacity: 0.75,
                      lineHeight: 1.65,
                      margin: "0 0 4px",
                      textAlign: "center",
                    }}>
                      You're back. Your account is set up and ready — let's seal this memory.
                    </p>

                    {err && <div className="teClaimError">{err}</div>}

                    <div className="teActionsRow">
                      <button
                        className="teBtn teBtnPrimary teBtnWide"
                        onClick={() => advanceTo("memoryType")}
                        disabled={busy}
                        type="button"
                      >
                        Let's Continue
                      </button>
                    </div>
                  </>
                )}

                <div style={{ textAlign: "center" }}>
                  <Link className="teLink" to="/">← Home</Link>
                </div>
              </div>
            </div>
          )}

          {/* STEP: ULA — inline license agreement within the claim flow */}
          {step === "ula" && (
            <div className="teCardBody teCardBody--ula">
              <div className="legal-scroll-box">
                <UlaContent compact />
              </div>
              {ulaError && <p className="teClaimError">{ulaError}</p>}
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.78rem",
                opacity: 0.55,
                textAlign: "center",
                margin: "16px 0 0",
              }}>
                By clicking Accept, you confirm you have read and agree to this User License Agreement.
              </p>
              <div className="teActionsRow">
                <button
                  className="teBtn teBtnPrimary teBtnWide"
                  onClick={doAcceptUla}
                  disabled={ulaAccepting}
                  type="button"
                >
                  {ulaAccepting ? "Saving…" : "I Accept"}
                </button>
              </div>
            </div>
          )}

            {/* STEP: PROFILE */}
            {step === "profile" && (
              <div className="teCardBody">
                <div className="teGrid">
                  {([
                    { key: "firstName"  as const, label: "First Name",            placeholder: "e.g., Elowen",              hint: "" },
                    { key: "lastName"   as const, label: "Last Name",             placeholder: "e.g., Blackthorne",         hint: "" },
                    { key: "address"    as const, label: "Mailing Address",       placeholder: "e.g., 123 Main Street",     hint: "Used for warranty fulfilment, legal notices, and ownership verification." },
                    { key: "email"      as const, label: "Email",                 placeholder: "e.g., you@email.com",       hint: "We'll send a confirmation to this address." },
                    { key: "cellNumber" as const, label: "Phone",                 placeholder: "e.g., +1 555 012 3456",    hint: "Used for ownership verification and as a backup contact for critical service notices." },
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
                      I accept the{" "}
                      <a href="/terms/plain" onClick={(e) => { e.preventDefault(); nav("/terms/plain"); }}>Plain English Terms</a>
                      {" "}and the{" "}
                      <a href="/terms" onClick={(e) => { e.preventDefault(); nav("/terms"); }}>Terms &amp; Conditions</a>.
                    </span>
                  </label>

                  <div className="teActionsRow">
                    <button
                      className="teBtn teBtnPrimary teBtnWide"
                      onClick={doSaveProfile}
                      disabled={busy || !termsAccepted || !profileData.firstName.trim() || !profileData.lastName.trim() || !profileData.email.trim()}
                      type="button"
                    >
                      {busy ? "Saving…" : "Continue"}
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
                        <span className="tePillSpec">
                          {t === "video" ? "Up to 30 seconds"
                            : t === "image" ? `Up to ${MAX_IMAGE_FILES} photos`
                            : "Under a minute"}
                        </span>
                      </button>
                    ))}
                  </div>
                  <InfoPanel question="What makes a great memory?">
                    <p style={{ margin: "0 0 10px" }}>
                      Short, focused moments have the strongest hold on people.
                      A quick clip or a few photos will be watched and revisited —
                      longer content gets skipped.
                    </p>
                    <ul style={{ margin: "0 0 10px", paddingLeft: 18 }}>
                      <li><strong>Video</strong> — 15–30 seconds is the sweet spot</li>
                      <li><strong>Photos</strong> — up to {MAX_IMAGE_FILES}, each one meaningful</li>
                      <li><strong>Audio</strong> — under a minute keeps listeners engaged</li>
                    </ul>
                    <p style={{ margin: 0, fontStyle: "italic", opacity: 0.85 }}>
                      A little moment keeps its magic the longest.
                    </p>
                  </InfoPanel>

                  <div className="teActionsRow">
                    <button
                      className="teBtn teBtnPrimary teBtnWide"
                      onClick={() => advanceTo("details")}
                      disabled={busy}
                      type="button"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: MEMORY DETAILS */}
            {step === "details" && (
              <div className="teCardBody">
                <div className="teGrid">
                  <MemoryDetailsFields
                    memoryName={memoryName}
                    memoryDescription={memoryDescription}
                    onNameChange={setMemoryName}
                    onDescChange={setMemoryDescription}
                    disabled={busy}
                  />
                  <div className="teActionsRow">
                    <button
                      className="teBtn teBtnPrimary teBtnWide"
                      onClick={() => advanceTo("upload")}
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
                      <span className="tePillDesc">Anyone with the charm can view the memory instantly.</span>
                    </button>
                    <button
                      className={"tePill tePillLarge " + (authMode === "glyph" ? "isActive" : "")}
                      onClick={() => setAuthMode("glyph")}
                      disabled={busy}
                      type="button"
                    >
                      <span className="tePillLabel">GLYPH LOCK</span>
                      <span className="tePillDesc">A secret symbol must be entered before the memory can be viewed.</span>
                    </button>
                  </div>

                  <InfoPanel question="Which should I choose?">
                    <p style={{ margin: "0 0 10px" }}>
                      <strong>Open</strong> is best for memories you want to share freely.
                      Anyone who holds the charm can tap and instantly experience the
                      moment — no barriers, no friction. Great for gifts, tributes, or
                      memories meant to be discovered.
                    </p>
                    <p style={{ margin: "0 0 10px" }}>
                      <strong>Glyph Lock</strong> adds a layer of intention. The viewer
                      must select the correct symbol before the memory is revealed —
                      like a secret handshake. Use this when a memory is personal and
                      you want to control who sees it.
                    </p>
                    <p style={{ margin: 0, opacity: 0.85 }}>
                      Keep in mind: the glyph is a shared secret, not a password.
                      The charm itself is the key — whoever holds it controls access.
                      The glyph simply ensures the memory isn't revealed by accident.
                    </p>
                  </InfoPanel>

                  {busy && sealPhase && (
                    <div>
                      <div className="teHint">
                        {sealPhase === "claim" ? "Claiming charm\u2026"
                          : sealPhase === "configure" ? "Configuring\u2026"
                          : `Uploading\u2026 ${Math.round(uploadPct)}%`}
                      </div>
                      {sealPhase === "upload" && (
                        <div style={{ marginTop: 6, height: 6, borderRadius: 3, background: "rgba(0,0,0,0.1)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${uploadPct}%`, background: "rgba(60,60,60,0.85)", transition: "width 0.2s" }} />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="teActionsRow">
                    <button
                      className="teBtn teBtnPrimary teBtnWide"
                      onClick={() => {
                        if (authMode === "glyph") {
                          advanceTo("glyphSelect");
                        } else {
                          doSealCharm();
                        }
                      }}
                      disabled={busy || working}
                      type="button"
                    >
                      {busy ? "Sealing\u2026" : authMode === "glyph" ? "Continue" : "Seal the Charm"}
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
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 10,
                    }}
                  >
                    {ALL_GLYPHS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        disabled={busy}
                        onClick={() => setSelectedGlyph(g.id)}
                        className={"tePill " + (selectedGlyph === g.id ? "isActive" : "")}
                        style={{ padding: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <img
                          src={g.image}
                          alt="Glyph"
                          style={{ maxWidth: "100%", maxHeight: 100, objectFit: "contain" }}
                          draggable={false}
                        />
                      </button>
                    ))}
                  </div>

                  {busy && sealPhase && (
                    <div>
                      <div className="teHint">
                        {sealPhase === "claim" ? "Claiming charm\u2026"
                          : sealPhase === "configure" ? "Configuring\u2026"
                          : `Uploading\u2026 ${Math.round(uploadPct)}%`}
                      </div>
                      {sealPhase === "upload" && (
                        <div style={{ marginTop: 6, height: 6, borderRadius: 3, background: "rgba(0,0,0,0.1)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${uploadPct}%`, background: "rgba(60,60,60,0.85)", transition: "width 0.2s" }} />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="teActionsRow">
                    <button
                      className="teBtn teBtnPrimary teBtnWide"
                      onClick={doSealCharm}
                      disabled={busy || working || !selectedGlyph}
                      type="button"
                    >
                      {busy ? "Sealing\u2026" : "Seal the Charm"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: UPLOAD (file selection only — sealing happens on protection step) */}
            {step === "upload" && (
              <div className="teCardBody">
                <label className="teField">
                  <div className="teFieldLabel">
                    Select {memoryType} file{memoryType === "image" ? `(s) — up to ${MAX_IMAGE_FILES}` : ""}
                  </div>

                  <div className="teRail">
                    <div className="teRailIcon" aria-hidden="true">&#x2726;</div>
                    <input
                      type="file"
                      accept={acceptTypes[memoryType]}
                      multiple={memoryType === "image"}
                      disabled={busy}
                      onChange={(e) => handleFileSelect(e.target.files)}
                      style={{ flex: 1, padding: "6px 0" }}
                    />
                  </div>
                  {fileErr && (
                    <div className="teClaimError" style={{ marginTop: 4 }}>{fileErr}</div>
                  )}
                  {!fileErr && files.length === 1 && (
                    <div className="teHint" style={{ marginTop: 4 }}>
                      {files[0].name} ({(files[0].size / 1024 / 1024).toFixed(1)} MB)
                    </div>
                  )}
                  {!fileErr && files.length > 1 && (
                    <div className="teHint" style={{ marginTop: 4 }}>
                      {files.length} files ({(files.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)} MB total)
                    </div>
                  )}
                </label>

                <div className="teActionsRow">
                  <button
                    className="teBtn teBtnPrimary teBtnWide"
                    onClick={() => advanceTo("protection")}
                    disabled={files.length === 0}
                    type="button"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP: DONE */}
            {step === "done" && (
              <div className="teCardBody">
                <div className="teHint">
                  Your charm is sealed. The memory is bound and ready to share.
                </div>

                {previewUrls.length > 0 && (
                  <div className="tePreview">
                    {memoryType === "video" && (
                      <video src={previewUrls[0]} controls playsInline className="tePreviewMedia" />
                    )}
                    {memoryType === "image" && (
                      <div className="teCarousel">
                        <div className="teCarouselViewport">
                          <img
                            src={previewUrls[carouselIdx]}
                            alt={`Memory ${carouselIdx + 1}`}
                            className="teCarouselImg"
                          />
                        </div>
                        {previewUrls.length > 1 && (
                          <>
                            <button
                              className="teCarouselArrow teCarouselPrev"
                              onClick={() => setCarouselIdx((i) => (i - 1 + previewUrls.length) % previewUrls.length)}
                              type="button"
                              aria-label="Previous image"
                            >
                              &#x276E;
                            </button>
                            <button
                              className="teCarouselArrow teCarouselNext"
                              onClick={() => setCarouselIdx((i) => (i + 1) % previewUrls.length)}
                              type="button"
                              aria-label="Next image"
                            >
                              &#x276F;
                            </button>
                            <div className="teCarouselDots">
                              {previewUrls.map((_, i) => (
                                <button
                                  key={i}
                                  className={"teCarouselDot " + (i === carouselIdx ? "isActive" : "")}
                                  onClick={() => setCarouselIdx(i)}
                                  type="button"
                                  aria-label={`Image ${i + 1}`}
                                />
                              ))}
                            </div>
                            <div className="teCarouselCounter">
                              {carouselIdx + 1} / {previewUrls.length}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {memoryType === "audio" && (
                      <audio src={previewUrls[0]} controls style={{ width: "100%" }} />
                    )}
                  </div>
                )}

                <div className="tePills tePillsWrap" style={{ marginTop: 14 }}>
                  <button
                    className="tePill"
                    onClick={() => nav(`/c/${encodeURIComponent(code)}`, { replace: true, state: { isOwner: true } })}
                    type="button"
                  >
                    View Charm
                  </button>
                </div>
              </div>
            )}
        </div>

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
