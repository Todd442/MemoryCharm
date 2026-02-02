import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

import { claimCharm, configureCharm, uploadCharm } from "../api";
import { loginRequest } from "../../../app/auth/msalConfig";

type Step = "configure" | "upload" | "done";

type MemoryType = "video" | "image" | "audio";
type AuthMode = "none" | "glyph";

export function ClaimCharmPage() {
  const nav = useNavigate();
  const { code } = useParams<{ code: string }>();

  const { instance, accounts, inProgress } = useMsal();

  const isAuthed = accounts.length > 0;
  const me = accounts[0] ?? null;

  const displayName = useMemo(() => {
    return me?.name ?? "Keeper";
  }, [me]);

  const emailish = useMemo(() => {
    // In MSAL, username is often email-like
    return me?.username ?? "";
  }, [me]);

  const [step, setStep] = useState<Step>("configure");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [claimed, setClaimed] = useState<{ charmId: string } | null>(null);

  const [memoryType, setMemoryType] = useState<MemoryType>("video");
  const [authMode, setAuthMode] = useState<AuthMode>("none");

  const [fileName, setFileName] = useState<string>("");

  // If you are not wrapping /claim in RequireAuth, this keeps the page usable:
  useEffect(() => {
    if (!isAuthed && inProgress === InteractionStatus.None) {
      // Leave it unauthenticated and show the Sign In button UI.
      // (We do not auto-redirect here; user has a clear action.)
    }
  }, [isAuthed, inProgress]);

  if (!code) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>Claim this Charm</div>
        <div style={{ color: "crimson" }}>Missing charm code.</div>
        <div style={{ marginTop: 14 }}>
          <Link to="/">Home</Link>
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
      // Redirect sign-out is most reliable in SPAs.
      await instance.logoutRedirect();
    } catch (e: any) {
      setErr(e?.message ?? "Sign-out failed.");
    }
  }

  async function doEditProfile() {
    setErr(null);

    // External ID supports profile editing via a separate user flow (recommended),
    // or you can do it via Microsoft Graph later.
    //
    // For now, we trigger a loginRedirect again; once you create an "Edit profile"
    // user flow, we will swap authority/policy here.
    try {
      await instance.loginRedirect(loginRequest);
    } catch (e: any) {
      setErr(e?.message ?? "Unable to open profile editor.");
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

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ fontSize: 26, marginBottom: 6 }}>Claim this Charm</div>
      <div style={{ opacity: 0.85, marginBottom: 10 }}>
        Charm code: <strong>{code}</strong>
      </div>

      {/* Auth banner */}
      <div
        style={{
          marginBottom: 14,
          padding: 12,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.25)",
        }}
      >
        {isAuthed ? (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, opacity: 0.85 }}>Signed in</div>
              <div style={{ fontSize: 16 }}>
                <strong>{displayName}</strong>
              </div>
              {emailish && (
                <div style={{ fontSize: 12, opacity: 0.75 }}>{emailish}</div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                onClick={doEditProfile}
                disabled={inProgress !== InteractionStatus.None}
                style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)" }}
              >
                Edit profile
              </button>
              <button
                onClick={doSignOut}
                disabled={inProgress !== InteractionStatus.None}
                style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)" }}
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, opacity: 0.85 }}>You’ll need an account to claim this charm.</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Sign up or sign in with Entra External ID.</div>
            </div>

            <button
              onClick={doSignIn}
              disabled={inProgress !== InteractionStatus.None}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(60,60,60,0.85)",
                color: "white",
                cursor: inProgress !== InteractionStatus.None ? "default" : "pointer",
                width: 140,
              }}
            >
              {inProgress !== InteractionStatus.None ? "Working…" : "Sign in"}
            </button>
          </div>
        )}
      </div>

      {err && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 10,
            background: "rgba(220,0,0,0.08)",
            color: "crimson",
          }}
        >
          {err}
        </div>
      )}

      {/* If not authed, stop here */}
      {!isAuthed && (
        <div style={{ opacity: 0.8, fontSize: 13 }}>
          <Link to="/">Home</Link>
        </div>
      )}

      {isAuthed && step === "configure" && (
        <div style={{ padding: 14, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12 }}>
          <div style={{ fontSize: 18 }}>1) Configure charm</div>

          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Memory type</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {(["video", "image", "audio"] as MemoryType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setMemoryType(t)}
                    disabled={busy}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: memoryType === t ? "rgba(255,255,255,0.08)" : "transparent",
                      color: "inherit",
                      cursor: busy ? "default" : "pointer",
                    }}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Playback protection</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => setAuthMode("none")}
                  disabled={busy}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: authMode === "none" ? "rgba(255,255,255,0.08)" : "transparent",
                    color: "inherit",
                  }}
                >
                  OPEN
                </button>
                <button
                  onClick={() => setAuthMode("glyph")}
                  disabled={busy}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: authMode === "glyph" ? "rgba(255,255,255,0.08)" : "transparent",
                    color: "inherit",
                  }}
                >
                  GLYPH LOCK
                </button>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                (Dev) Mock glyph success is “7”. We’ll make this configurable later.
              </div>
            </div>

            <button
              onClick={doClaimAndConfigure}
              disabled={busy || inProgress !== InteractionStatus.None}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.25)",
                background: busy ? "rgba(120,120,120,0.25)" : "rgba(60,60,60,0.85)",
                color: "white",
                cursor: busy ? "default" : "pointer",
                width: 220,
              }}
            >
              {busy ? "Binding charm…" : "Claim & Continue"}
            </button>

            {claimed && (
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Claimed as: <strong>{claimed.charmId}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {isAuthed && step === "upload" && (
        <div style={{ padding: 14, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12 }}>
          <div style={{ fontSize: 18, marginBottom: 10 }}>2) Upload (mock)</div>

          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 10 }}>
            We’re not doing real file transfer yet. Pick a filename; the server will attach a sample media URL.
          </div>

          <label style={{ display: "block" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>File name</div>
            <input
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
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.15)",
                color: "inherit",
              }}
            />
          </label>

          <div style={{ marginTop: 12 }}>
            <button
              onClick={doUpload}
              disabled={busy || inProgress !== InteractionStatus.None}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.25)",
                background: busy ? "rgba(120,120,120,0.25)" : "rgba(60,60,60,0.85)",
                color: "white",
                cursor: busy ? "default" : "pointer",
                width: 180,
              }}
            >
              {busy ? "Uploading…" : "Upload"}
            </button>
          </div>
        </div>
      )}

      {isAuthed && step === "done" && (
        <div style={{ padding: 14, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12 }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>Done</div>
          <div style={{ opacity: 0.85, marginBottom: 14 }}>
            Your charm is claimed, configured, and has a memory attached.
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => nav(`/c/${encodeURIComponent(code)}`)}
              style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", color: "inherit", background: "transparent" }}
            >
              View Landing (/c/{code})
            </button>

            <button
              onClick={() => nav(`/c?Token=t:${encodeURIComponent(code)}`)}
              style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", color: "inherit", background: "transparent" }}
            >
              Simulate NFC (/c?Token=…)
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 18, fontSize: 13, opacity: 0.7 }}>
        <Link to="/">Home</Link>
      </div>
    </div>
  );
}
