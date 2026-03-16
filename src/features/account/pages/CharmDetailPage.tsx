import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

import { getCharmDetail, updateGlyph, uploadCharm, updateCharmMeta, factoryResetCharm } from "../api";
import { configureCharm } from "../../claim/api";
import type { UserCharmDetail } from "../api";
import { ALL_GLYPHS } from "../../../app/data/glyphs";
import { useStatus } from "../../../app/providers/StatusProvider";
import { ThemedInput } from "../../../components/ThemedInput";
import { MemoryDetailsFields } from "../../claim/pages/ClaimCharmPage";
import { ImageStrip } from "../../../components/ImageStrip";
import "../../claim/pages/ClaimCharmPage.css"; // shared .tePill, .teBtn styles + .teTextarea
import "./CharmDetailPage.css";

type MemoryType = "video" | "image" | "audio";

export function CharmDetailPage() {
  const nav = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { inProgress } = useMsal();
  const { setStatus } = useStatus();
  const working = inProgress !== InteractionStatus.None;

  const [loading, setLoading] = useState(true);
  const [charm, setCharm] = useState<UserCharmDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Glyph editing state
  const [editAuthMode, setEditAuthMode] = useState<"none" | "glyph">("none");
  const [editGlyphId, setEditGlyphId] = useState<string | null>(null);
  const [glyphDirty, setGlyphDirty] = useState(false);

  // Memory meta editing state
  const [editMemoryName, setEditMemoryName] = useState("");
  const [editMemoryDescription, setEditMemoryDescription] = useState("");
  const [metaDirty, setMetaDirty] = useState(false);

  // Upload state
  const [files, setFiles] = useState<File[]>([]);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [carouselIdx, setCarouselIdx] = useState(0);

  // Memory type editing state
  const [editMemoryType, setEditMemoryType] = useState<MemoryType | null>(null);
  const [typeChangePending, setTypeChangePending] = useState<MemoryType | null>(null);

  // Factory reset state
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    setStatus({ text: "Charm Details", subtitle: "Manage your memory charm." });
  }, [setStatus]);

  // Load charm detail
  useEffect(() => {
    if (!code) return;
    async function load() {
      try {
        const detail = await getCharmDetail(code!);
        setCharm(detail);
        setCarouselIdx(0);
        setEditAuthMode(detail.authMode as "none" | "glyph");
        if (detail.glyphId) setEditGlyphId(detail.glyphId);
        setEditMemoryName(detail.memoryName ?? "");
        setEditMemoryDescription(detail.memoryDescription ?? "");
        setEditMemoryType(detail.memoryType as MemoryType | null);
        setTypeChangePending(null);
        setMetaDirty(false);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load charm.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code]);

  function handleAuthModeChange(mode: "none" | "glyph") {
    setEditAuthMode(mode);
    if (mode === "none") setEditGlyphId(null);
    setGlyphDirty(true);
  }

  function handleGlyphSelect(id: string) {
    setEditGlyphId(id);
    setGlyphDirty(true);
  }

  async function handleSaveGlyph() {
    if (!code) return;
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      await updateGlyph(code, editAuthMode, editGlyphId ?? undefined);
      setMsg("Glyph updated.");
      setGlyphDirty(false);
      // Refresh charm data
      const detail = await getCharmDetail(code);
      setCharm(detail);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update glyph.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveMeta() {
    if (!code) return;
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      await updateCharmMeta(
        code,
        editMemoryName.trim() || null,
        editMemoryDescription.trim() || null
      );
      setMsg("Memory details updated.");
      setMetaDirty(false);
      const detail = await getCharmDetail(code);
      setCharm(detail);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update memory details.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFactoryReset() {
    if (!code) return;
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      await factoryResetCharm(code);
      // Clear the "sealed" session flag so the claim flow isn't short-circuited
      // back to /c/:code when the user (or a tester) scans the charm again.
      sessionStorage.removeItem(`mc.sealed.${code}`);
      nav("/account");
    } catch (e: any) {
      setErr(e?.message ?? "Factory reset failed.");
      setBusy(false);
    }
  }

  const maxCharmMB = (editMemoryType ?? charm?.memoryType) === "image"
    ? (Number(import.meta.env.VITE_MAX_IMAGE_SIZE_MB) || 40)
    : (Number(import.meta.env.VITE_MAX_CHARM_SIZE_MB) || 150);
  const MAX_CHARM_BYTES = maxCharmMB * 1024 * 1024;

  const acceptTypes: Record<MemoryType, string> = {
    video: "video/mp4,video/webm,video/quicktime",
    image: "image/jpeg,image/png,image/gif,image/webp",
    audio: "audio/mpeg,audio/wav,audio/ogg,audio/aac",
  };

  async function handleUpload() {
    if (!code || !charm || !editMemoryType || files.length === 0) return;
    const totalBytes = files.reduce((s, f) => s + f.size, 0);
    if (totalBytes > MAX_CHARM_BYTES) {
      setErr(`Total file size exceeds ${maxCharmMB} MB limit.`);
      return;
    }
    setErr(null);
    setMsg(null);
    setBusy(true);
    setUploadPct(0);
    try {
      if (editMemoryType !== charm.memoryType) {
        await configureCharm(
          code,
          editMemoryType,
          charm.authMode as "none" | "glyph",
          charm.glyphId ?? undefined,
          editMemoryName.trim() || undefined,
          editMemoryDescription.trim() || undefined
        );
      }
      await uploadCharm(code, files, files[0].type, setUploadPct);
      setMsg("Content updated successfully.");
      setFiles([]);
      setFileErr(null);
      // Refresh charm data
      const detail = await getCharmDetail(code);
      setCharm(detail);
      setEditMemoryType(detail.memoryType as MemoryType | null);
    } catch (e: any) {
      const errMsg = (e?.message ?? "").toLowerCase();
      if (errMsg.includes("content_settled") || errMsg.includes("settled")) {
        setErr("This memory has settled and can no longer be changed.");
      } else {
        setErr(e?.message ?? "Upload failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  const MAX_IMAGE_FILES = 10;

  function addImages(newFiles: File[]) {
    setFileErr(null);
    setFiles(prev => {
      const combined = [...prev, ...newFiles];
      const capped = combined.slice(0, MAX_IMAGE_FILES);
      if (combined.length > MAX_IMAGE_FILES) {
        setFileErr(`Up to ${MAX_IMAGE_FILES} photos allowed. Some were not added.`);
      }
      const totalBytes = capped.reduce((s, f) => s + f.size, 0);
      if (totalBytes > MAX_CHARM_BYTES) {
        setFileErr(`Adding those photos would exceed the ${maxCharmMB} MB limit. Try removing some first.`);
        return prev;
      }
      return capped;
    });
  }

  function removeImage(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileErr(null);
  }

  if (loading) {
    return (
      <div className="teCharmWrap">
        <div className="teCharmPanel">
          <div className="teCharmSection">
            <div style={{ textAlign: "center", padding: 20, fontSize: "var(--fs-meta)", opacity: 0.7 }}>
              Loading charm...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!charm) {
    return (
      <div className="teCharmWrap">
        <div className="teCharmPanel">
          <div className="teCharmSection">
            <div style={{ textAlign: "center", padding: 20, fontSize: "var(--fs-meta)", opacity: 0.7 }}>
              Charm not found.
            </div>
          </div>
          <div className="teCharmNav">
            <Link to="/account">Back to Account</Link>
          </div>
        </div>
      </div>
    );
  }

  // Settling calculations
  const settleProgress = (() => {
    if (!charm.firstFinalizedAt) return 0;
    const start = new Date(charm.firstFinalizedAt).getTime();
    const end = start + 14 * 86400000;
    const now = Date.now();
    if (now >= end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  })();

  const daysUntilSettled = (() => {
    if (!charm.settlesAt) return null;
    const ms = new Date(charm.settlesAt).getTime() - Date.now();
    if (ms <= 0) return 0;
    return Math.ceil(ms / 86400000);
  })();

  function fmtDate(iso: string | null): string {
    if (!iso) return "\u2014";
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <>
      <div className="teCharmWrap">
        <div className="teCharmPanel">
          {err && (
            <div style={{
              margin: "0 0 12px",
              padding: "12px",
              borderRadius: 12,
              background: "rgba(220,0,0,0.08)",
              color: "#ff6a6a",
              border: "1px solid rgba(255,90,90,0.18)",
              fontSize: "var(--fs-meta)",
            }}>
              {err}
            </div>
          )}
          {msg && (
            <div style={{
              margin: "0 0 12px",
              padding: "12px",
              borderRadius: 12,
              background: "rgba(100,200,130,0.08)",
              color: "#a6ffb9",
              border: "1px solid rgba(100,200,130,0.18)",
              fontSize: "var(--fs-meta)",
            }}>
              {msg}
            </div>
          )}

          {/* View Charm shortcut */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
            <button
              className="teBtn teBtnSm teBtnGhost"
              onClick={() => nav(`/c/${encodeURIComponent(charm.charmId)}`, { state: { isOwner: true } })}
              type="button"
            >
              View Charm &#8594;
            </button>
          </div>

          {/* Memory Details (name + description) */}
          <details className="teCharmSection" open>
            <summary className="teCharmSectionTitle">Memory Details</summary>
            <div style={{ display: "grid", gap: 12 }}>
              <MemoryDetailsFields
                memoryName={editMemoryName}
                memoryDescription={editMemoryDescription}
                onNameChange={(v) => { setEditMemoryName(v); setMetaDirty(true); }}
                onDescChange={(v) => { setEditMemoryDescription(v); setMetaDirty(true); }}
                disabled={busy}
              />
              <div>
                <button
                  className="teBtn teBtnPrimary"
                  onClick={handleSaveMeta}
                  disabled={busy || working || !metaDirty}
                  type="button"
                >
                  {busy ? "Saving\u2026" : "Save Details"}
                </button>
              </div>
            </div>
          </details>

          {/* Glyph Management (always available) */}
          <details className="teCharmSection">
            <summary className="teCharmSectionTitle">Glyph Protection</summary>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div className="teCharmInfoLabel" style={{ marginBottom: 6 }}>Playback Protection</div>
                <div className="tePills">
                  <button
                    className={"tePill " + (editAuthMode === "none" ? "isActive" : "")}
                    onClick={() => handleAuthModeChange("none")}
                    disabled={busy}
                    type="button"
                  >
                    OPEN
                  </button>
                  <button
                    className={"tePill " + (editAuthMode === "glyph" ? "isActive" : "")}
                    onClick={() => handleAuthModeChange("glyph")}
                    disabled={busy}
                    type="button"
                  >
                    GLYPH LOCK
                  </button>
                </div>
              </div>

              {editAuthMode === "glyph" && (
                <div>
                  <div className="teCharmInfoLabel" style={{ marginBottom: 8 }}>
                    Select glyph
                  </div>
                  <div className="teCharmGlyphGrid">
                    {ALL_GLYPHS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        disabled={busy}
                        onClick={() => handleGlyphSelect(g.id)}
                        className={"tePill " + (editGlyphId === g.id ? "isActive" : "")}
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
                </div>
              )}

              <div>
                <button
                  className="teBtn teBtnPrimary"
                  onClick={handleSaveGlyph}
                  disabled={busy || working || !glyphDirty || (editAuthMode === "glyph" && !editGlyphId)}
                  type="button"
                >
                  {busy ? "Saving\u2026" : "Save Protection Mode"}
                </button>
              </div>
            </div>
          </details>

          {/* Content Management */}
          <details className="teCharmSection">
            <summary className="teCharmSectionTitle">Content</summary>

            {/* Content preview — owner always sees their stored media */}
            {charm.files && charm.files.length > 0 && charm.memoryType && (
              <div className="tePreview" style={{ marginBottom: 14 }}>
                {charm.memoryType === "video" && (
                  <video src={charm.files[0].url} controls playsInline className="tePreviewMedia" />
                )}
                {charm.memoryType === "image" && (
                  <div className="teCarousel">
                    <div className="teCarouselViewport">
                      <img
                        src={charm.files[carouselIdx % charm.files.length]?.url}
                        alt={`Memory ${(carouselIdx % charm.files.length) + 1}`}
                        className="teCarouselImg"
                      />
                    </div>
                    {charm.files.length > 1 && (
                      <>
                        <button
                          className="teCarouselArrow teCarouselPrev"
                          onClick={() => setCarouselIdx((i) => (i - 1 + charm.files!.length) % charm.files!.length)}
                          type="button"
                          aria-label="Previous image"
                        >
                          &#x276E;
                        </button>
                        <button
                          className="teCarouselArrow teCarouselNext"
                          onClick={() => setCarouselIdx((i) => (i + 1) % charm.files!.length)}
                          type="button"
                          aria-label="Next image"
                        >
                          &#x276F;
                        </button>
                        <div className="teCarouselDots">
                          {charm.files.map((_, i) => (
                            <button
                              key={i}
                              className={"teCarouselDot " + (i === carouselIdx % charm.files!.length ? "isActive" : "")}
                              onClick={() => setCarouselIdx(i)}
                              type="button"
                              aria-label={`Image ${i + 1}`}
                            />
                          ))}
                        </div>
                        <div className="teCarouselCounter">
                          {(carouselIdx % charm.files.length) + 1} / {charm.files.length}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {charm.memoryType === "audio" && (
                  <audio src={charm.files[0].url} controls style={{ width: "100%" }} />
                )}
              </div>
            )}

            {charm.isExpired ? (
              <div className="teCharmSettledMsg">
                This memory has faded and can no longer be changed.
              </div>
            ) : charm.isSettled ? (
              <div className="teCharmSettledMsg">
                This memory has settled and can no longer be changed.
              </div>
            ) : charm.canEditContent && charm.memoryType ? (
              <div className="teCharmUploadArea">
                {/* Memory type selector */}
                <div>
                  <div className="teCharmInfoLabel" style={{ marginBottom: 6 }}>Memory Type</div>
                  <div className="tePills">
                    {(["video", "image", "audio"] as MemoryType[]).map((t) => (
                      <button
                        key={t}
                        className={"tePill " + (editMemoryType === t ? "isActive" : "")}
                        onClick={() => {
                          if (t === editMemoryType) return;
                          const hasContent = charm.files && charm.files.length > 0;
                          if (hasContent && t !== charm.memoryType) {
                            setTypeChangePending(t);
                          } else {
                            setEditMemoryType(t);
                            setFiles([]);
                            setFileErr(null);
                          }
                        }}
                        disabled={busy || !!typeChangePending}
                        type="button"
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* Type change warning */}
                  {typeChangePending && (
                    <div style={{
                      marginTop: 12,
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "rgba(220,120,0,0.08)",
                      border: "1px solid rgba(220,120,0,0.28)",
                      fontSize: "var(--fs-meta)",
                    }}>
                      <div style={{ color: "#f5c842", marginBottom: 8 }}>
                        Changing to <strong>{typeChangePending.toUpperCase()}</strong> will permanently replace all existing content on this charm. This cannot be undone.
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="teBtn teBtnSm teBtnGhost"
                          onClick={() => setTypeChangePending(null)}
                          type="button"
                        >
                          Cancel
                        </button>
                        <button
                          className="teBtn teBtnSm teBtnPrimary"
                          onClick={() => {
                            setEditMemoryType(typeChangePending);
                            setTypeChangePending(null);
                            setFiles([]);
                            setFileErr(null);
                          }}
                          type="button"
                        >
                          Confirm Change
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* File picker */}
                {!typeChangePending && editMemoryType && (
                  <div>
                    <div className="teCharmInfoLabel" style={{ marginBottom: 6 }}>
                      {editMemoryType === "image" ? "Photos to upload" : `Replace ${editMemoryType} content`}
                    </div>
                    {editMemoryType === "image" && files.length > 0 ? (
                      <ImageStrip
                        files={files}
                        onRemove={removeImage}
                        onAdd={addImages}
                        max={MAX_IMAGE_FILES}
                        disabled={busy}
                        accept={acceptTypes.image}
                        error={fileErr}
                      />
                    ) : (
                      <>
                        <input
                          key={editMemoryType}
                          type="file"
                          accept={acceptTypes[editMemoryType] ?? "*/*"}
                          multiple={editMemoryType === "image"}
                          disabled={busy}
                          onChange={(e) => {
                            const selected = e.target.files;
                            if (!selected || selected.length === 0) return;
                            if (editMemoryType === "image") {
                              addImages(Array.from(selected));
                            } else {
                              setFiles(Array.from(selected));
                            }
                          }}
                          style={{ padding: "6px 0" }}
                        />
                        {files.length === 1 && editMemoryType !== "image" && (
                          <div style={{ fontSize: "var(--fs-xs)", opacity: 0.7, marginTop: 4 }}>
                            {files[0].name} ({(files[0].size / 1024 / 1024).toFixed(1)} MB)
                          </div>
                        )}
                        {fileErr && (
                          <div style={{ fontSize: "var(--fs-xs)", color: "#e07070", marginTop: 4 }}>
                            {fileErr}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {busy && (
                  <div className="teCharmProgress">
                    <div
                      className="teCharmProgressFill"
                      style={{ width: `${uploadPct}%` }}
                    />
                  </div>
                )}

                <div>
                  <button
                    className="teBtn teBtnPrimary"
                    onClick={handleUpload}
                    disabled={busy || working || files.length === 0 || !!typeChangePending}
                    type="button"
                  >
                    {busy ? "Uploading\u2026" : "Upload"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="teCharmSettledMsg">
                {charm.status === "configured"
                  ? "Complete the initial setup via the claim flow to enable content management."
                  : "Content management is not available for this charm."}
              </div>
            )}
          </details>

          {/* Charm Info */}
          <details className="teCharmSection">
            <summary className="teCharmSectionTitle">Charm Info</summary>
            <div className="teCharmInfo">
              <ThemedInput readOnly label="Charm ID" value={charm.charmId} />
              <ThemedInput readOnly label="Status" value={charm.isExpired ? "Expired" : charm.isSettled ? "Settled" : charm.status} />
              <ThemedInput readOnly label="Charm Tier" value={charm.charmTier === "retail" ? "Retail" : charm.charmTier ? `${charm.charmTier.replace("-", "-Year ").replace(/^\w/, (c) => c.toUpperCase()).replace(/ $/, "")}` : ""} />
              <ThemedInput readOnly label="Expires" value={charm.expiresAt ? fmtDate(charm.expiresAt) : "Never"} />
              <ThemedInput readOnly label="Memory Type" value={charm.memoryType ?? ""} />
              <ThemedInput readOnly label="Protection" value={charm.authMode === "glyph" ? "Glyph Lock" : "Open"} />
              <ThemedInput readOnly label="Claimed" value={fmtDate(charm.claimedAt)} />
              <ThemedInput readOnly label="Configured" value={fmtDate(charm.configuredAt)} />
            </div>

            {/* Settling progress */}
            {charm.firstFinalizedAt && (
              <div className="teCharmSettleBar">
                <div className="teCharmSettleLabel">
                  {charm.isSettled
                    ? "This memory has settled."
                    : `Settles in ${daysUntilSettled} day${daysUntilSettled === 1 ? "" : "s"}`}
                </div>
                <div className="teCharmSettleTrack">
                  <div
                    className="teCharmSettleFill"
                    style={{ width: `${settleProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Fading warning */}
            {charm.isFading && (
              <div className="teCharmFadingBar">
                This memory will begin to fade in {charm.fadingInDays} day{charm.fadingInDays === 1 ? "" : "s"}.
                Visit the Arcane Emporium to extend its life.
              </div>
            )}

            {/* Expired notice */}
            {charm.isExpired && (
              <div className="teCharmFadingBar teCharmFadingBar--expired">
                This memory has faded beyond recall.
              </div>
            )}
          </details>

          {/* Manage / Purchase */}
          <div className="teCharmSection" style={{ textAlign: "center" }}>
            <button
              className="teBtn teBtnPrimary"
              onClick={() => nav(`/account/charms/${encodeURIComponent(charm.charmId)}/purchase`)}
              type="button"
            >
              Arcane Emporium
            </button>
          </div>

          {/* Factory Reset (testing only) */}
          <details className="teCharmSection">
            <summary className="teCharmSectionTitle" style={{ color: "rgba(255,100,100,0.8)" }}>
              Danger Zone
            </summary>
            {!resetConfirm ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: "var(--fs-meta)", opacity: 0.75 }}>
                  Factory reset wipes all content, ownership, and metadata from this charm.
                  The charm code will be reusable as if brand new.
                </div>
                <div>
                  <button
                    className="teBtn"
                    style={{ background: "rgba(200,40,40,0.15)", border: "1px solid rgba(200,40,40,0.4)", color: "#ff7070" }}
                    onClick={() => setResetConfirm(true)}
                    disabled={busy}
                    type="button"
                  >
                    Factory Reset
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(220,40,40,0.08)",
                border: "1px solid rgba(220,40,40,0.35)",
                display: "grid",
                gap: 10,
              }}>
                <div style={{ color: "#ff7070", fontSize: "var(--fs-meta)" }}>
                  This will permanently delete all content and unlink this charm from your account.
                  This cannot be undone.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="teBtn teBtnSm teBtnGhost"
                    onClick={() => setResetConfirm(false)}
                    disabled={busy}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="teBtn teBtnSm"
                    style={{ background: "rgba(200,40,40,0.25)", border: "1px solid rgba(200,40,40,0.5)", color: "#ff7070" }}
                    onClick={handleFactoryReset}
                    disabled={busy}
                    type="button"
                  >
                    {busy ? "Resetting\u2026" : "Confirm Reset"}
                  </button>
                </div>
              </div>
            )}
          </details>

          <div className="teCharmNav">
            <Link to="/account">Back to Account</Link>
          </div>
        </div>
      </div>

    </>
  );
}
