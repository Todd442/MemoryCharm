import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

import { claimCharm, configureCharm, uploadCharm, getUserMe, saveProfile } from "../api";
import type { UserProfile } from "../api";
import { loginRequest } from "../../../app/auth/msalConfig";

import "./ClaimCharmPage.css";

type Step = "loading" | "profile" | "configure" | "upload" | "done";
type MemoryType = "video" | "image" | "audio";
type AuthMode = "none" | "glyph";

export function ClaimCharmPage() {
  const nav = useNavigate();
  const { code } = useParams<{ code: string }>();

  const { instance, accounts, inProgress } = useMsal();

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

  const [fileName, setFileName] = useState<string>("");

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
          setStep("configure");
        } else {
          setStep("profile");
        }
      })
      .catch((e: any) => {
        setErr(e?.message ?? "Failed to check profile.");
        setStep("configure"); // fall back so the page isn't stuck
      });
  }, [isAuthed, emailish]);

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
      setStep("configure");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save profile.");
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

      await configureCharm(code, memoryType, authMode);
      setStep("upload");
    } catch (e: any) {
      setErr(e?.message ?? "Claim/configure failed.");
    } finally {
      setBusy(false);
    }
  }

  async function doUpload() {
    setErr(null);
    setBusy(true);
    try {
      if (!fileName.trim()) {
        setErr("Pick a file (name) to upload. (Mock upload only)");
        setBusy(false);
        return;
      }

      await uploadCharm(code, memoryType, fileName.trim());
      setStep("done");
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const working = inProgress !== InteractionStatus.None;

  return (
    <div className="teClaimWrap">
      <div className="teClaimPanel">
        <header className="teClaimHero">
          <h1>Bind the Charm</h1>
          <p>Bind thy name to the ledger, and the Mechanism shall remember.</p>
        </header>

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

              <div className="teAuthActions">
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
                {step === "loading" ? "…" : step === "profile" ? "KEEPER" : step === "configure" ? "REGISTRATION" : step === "upload" ? "UPLOAD" : "SEALED"}
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
                <div className="teStepTitle">Set up your Keeper profile</div>

                <div className="teGrid">
                  {([
                    { key: "firstName" as const, label: "First name", icon: "✦", placeholder: "Aria" },
                    { key: "lastName" as const, label: "Last name", icon: "✦", placeholder: "Venn" },
                    { key: "address" as const, label: "Address", icon: "◎", placeholder: "12 Hollow Lane" },
                    { key: "email" as const, label: "Email", icon: "✉", placeholder: "keeper@example.com" },
                    { key: "cellNumber" as const, label: "Cell number", icon: "☎", placeholder: "+1 555 012 3456" },
                  ] as const).map(({ key, label, icon, placeholder }) => (
                    <label key={key} className="teField">
                      <div className="teFieldLabel">{label}</div>
                      <div className="teRail">
                        <div className="teRailIcon" aria-hidden="true">{icon}</div>
                        <input
                          className="teRailInput"
                          value={profileData[key]}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, [key]: e.target.value }))}
                          disabled={busy}
                          placeholder={placeholder}
                        />
                      </div>
                    </label>
                  ))}

                  <div className="teActionsRow">
                    <button
                      className="teBtn teBtnPrimary teBtnWide"
                      onClick={doSaveProfile}
                      disabled={busy || !profileData.firstName.trim() || !profileData.lastName.trim() || !profileData.email.trim()}
                      type="button"
                    >
                      {busy ? "Saving…" : "Save & Continue"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: CONFIGURE */}
            {step === "configure" && (
              <div className="teCardBody">
                <div className="teStepTitle">1) Configure charm</div>

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

                    <div className="teHint">
                      (Dev) Mock glyph success is “7”. We’ll make this configurable later.
                    </div>
                  </div>

                  <div className="teActionsRow">
                    <button
                      className="teBtn teBtnPrimary teBtnWide"
                      onClick={doClaimAndConfigure}
                      disabled={busy || working}
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
                <div className="teStepTitle">2) Upload (mock)</div>
                <div className="teHint">
                  We’re not doing real file transfer yet. Pick a filename; the server will attach a sample media URL.
                </div>

                <label className="teField">
                  <div className="teFieldLabel">File name</div>

                  <div className="teRail">
                    <div className="teRailIcon" aria-hidden="true">✦</div>
                    <input
                      className="teRailInput"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      disabled={busy}
                      placeholder={
                        memoryType === "video"
                          ? "my_video.mov"
                          : memoryType === "image"
                          ? "my_photo.jpg"
                          : "my_audio.m4a"
                      }
                    />
                  </div>
                </label>

                <div className="teActionsRow">
                  <button
                    className="teBtn teBtnPrimary"
                    onClick={doUpload}
                    disabled={busy || working}
                    type="button"
                  >
                    {busy ? "Uploading…" : "Upload"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP: DONE */}
            {step === "done" && (
              <div className="teCardBody">
                <div className="teStepTitle">Done</div>
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
  );
}
