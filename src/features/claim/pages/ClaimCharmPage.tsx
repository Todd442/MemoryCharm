import React, { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { claimCharm, configureCharm, mockLogin, uploadCharm } from "../api";

type Step = "signin" | "configure" | "upload" | "done";

type MemoryType = "video" | "image" | "audio";
type AuthMode = "none" | "glyph";

const LS_USER_KEY = "mock.user";

export function ClaimCharmPage() {
  const nav = useNavigate();
  const { code } = useParams<{ code: string }>();

  const existingUser = useMemo(() => {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      return raw ? JSON.parse(raw) as { id: string; name: string; email: string } : null;
    } catch {
      return null;
    }
  }, []);

  const [step, setStep] = useState<Step>(existingUser ? "configure" : "signin");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [userName, setUserName] = useState(existingUser?.name ?? "Keeper");
  const [userEmail, setUserEmail] = useState(existingUser?.email ?? "keeper@example.com");

  const [claimed, setClaimed] = useState<{ charmId: string } | null>(null);

  const [memoryType, setMemoryType] = useState<MemoryType>("video");
  const [authMode, setAuthMode] = useState<AuthMode>("none");

  const [fileName, setFileName] = useState<string>("");

  if (!code) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>Claim this Charm</div>
        <div style={{ color: "crimson" }}>Missing charm code.</div>
        <div style={{ marginTop: 14 }}><Link to="/">Home</Link></div>
      </div>
    );
  }

  async function doSignIn() {
    setErr(null);
    setBusy(true);
    try {
      const res = await mockLogin(userName.trim() || "Keeper", userEmail.trim() || "keeper@example.com");
      localStorage.setItem(LS_USER_KEY, JSON.stringify(res.user));
      setStep("configure");
    } catch (e: any) {
      setErr(e?.message ?? "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function doClaimAndConfigure() {
    setErr(null);
    setBusy(true);
    try {
      // Claim
      const c = await claimCharm(code);
      setClaimed({ charmId: c.charmId });

      // Configure
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

  function signOut() {
    localStorage.removeItem(LS_USER_KEY);
    nav(`/claim/${encodeURIComponent(code)}`, { replace: true });
    window.location.reload();
  }

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ fontSize: 26, marginBottom: 6 }}>Claim this Charm</div>
      <div style={{ opacity: 0.85, marginBottom: 14 }}>
        Charm code: <strong>{code}</strong>
      </div>

      {err && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: "rgba(220,0,0,0.08)", color: "crimson" }}>
          {err}
        </div>
      )}

      {step === "signin" && (
        <div style={{ padding: 14, border: "1px solid #ddd", borderRadius: 12 }}>
          <div style={{ fontSize: 18, marginBottom: 10 }}>1) Sign in (mock)</div>

          <div style={{ display: "grid", gap: 10 }}>
            <label>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Name</div>
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                disabled={busy}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
              />
            </label>

            <label>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Email</div>
              <input
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                disabled={busy}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
              />
            </label>

            <button
              onClick={doSignIn}
              disabled={busy}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.25)",
                background: busy ? "rgba(120,120,120,0.25)" : "rgba(60,60,60,0.85)",
                color: "white",
                cursor: busy ? "default" : "pointer",
                width: 180,
              }}
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
            This is just for dev flow. We’ll replace with real auth later.
          </div>
        </div>
      )}

      {step === "configure" && (
        <div style={{ padding: 14, border: "1px solid #ddd", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div style={{ fontSize: 18 }}>2) Configure charm</div>
            <button onClick={signOut} disabled={busy} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ccc" }}>
              Sign out
            </button>
          </div>

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
                      border: "1px solid #ccc",
                      background: memoryType === t ? "rgba(0,0,0,0.08)" : "white",
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
                    border: "1px solid #ccc",
                    background: authMode === "none" ? "rgba(0,0,0,0.08)" : "white",
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
                    border: "1px solid #ccc",
                    background: authMode === "glyph" ? "rgba(0,0,0,0.08)" : "white",
                  }}
                >
                  GLYPH LOCK
                </button>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                Mock glyph success is “7”. We’ll make this configurable later.
              </div>
            </div>

            <button
              onClick={doClaimAndConfigure}
              disabled={busy}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.25)",
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

      {step === "upload" && (
        <div style={{ padding: 14, border: "1px solid #ddd", borderRadius: 12 }}>
          <div style={{ fontSize: 18, marginBottom: 10 }}>3) Upload (mock)</div>

          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 10 }}>
            We’re not doing real file transfer yet. Pick a filename; the server will attach a sample media URL.
          </div>

          <label style={{ display: "block" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>File name</div>
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              disabled={busy}
              placeholder={memoryType === "video" ? "my_video.mov" : memoryType === "image" ? "my_photo.jpg" : "my_audio.m4a"}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            />
          </label>

          <div style={{ marginTop: 12 }}>
            <button
              onClick={doUpload}
              disabled={busy}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.25)",
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

      {step === "done" && (
        <div style={{ padding: 14, border: "1px solid #ddd", borderRadius: 12 }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>Done</div>
          <div style={{ opacity: 0.85, marginBottom: 14 }}>
            Your charm is claimed, configured, and has a memory attached.
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => nav(`/c/${encodeURIComponent(code)}`)}
              style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #ccc" }}
            >
              View Landing (/c/{code})
            </button>

            <button
              onClick={() => nav(`/c?token=t:${encodeURIComponent(code)}`)}
              style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #ccc" }}
            >
              Simulate NFC (/c?token=…)
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
