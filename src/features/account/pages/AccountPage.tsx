import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

import { getUserMe, saveProfile, getUserCharms } from "../api";
import type { UserProfile, UserCharmSummary } from "../api";
import { useStatus } from "../../../app/providers/StatusProvider";
import { ThemedInput } from "../../../components/ThemedInput";
import "../../claim/pages/ClaimCharmPage.css"; // shared .teBtn styles
import "./AccountPage.css";

export function AccountPage() {
  const nav = useNavigate();
  const { instance, inProgress } = useMsal();
  const { setStatus } = useStatus();

  const working = inProgress !== InteractionStatus.None;

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    address: "",
    email: "",
    cellNumber: "",
  });
  const [charms, setCharms] = useState<UserCharmSummary[]>([]);

  useEffect(() => {
    setFooterEl(document.getElementById("te-footer"));
  }, []);

  useEffect(() => {
    setStatus({ text: "Your Account", subtitle: "Keeper's ledger and charms." });
  }, [setStatus]);

  // Load profile and charms on mount
  useEffect(() => {
    async function load() {
      try {
        const [profileRes, charmsRes] = await Promise.all([
          getUserMe(),
          getUserCharms(),
        ]);
        if (profileRes.hasProfile && profileRes.profile) {
          setProfile(profileRes.profile);
        }
        setCharms(charmsRes);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load account data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSaveProfile() {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const res = await saveProfile(profile);
      setProfile(res.profile);
      setMsg("Profile saved.");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save profile.");
    } finally {
      setBusy(false);
    }
  }

  async function doSignOut() {
    try {
      await instance.logoutRedirect();
    } catch {
      // handled by MSAL
    }
  }

  function settlingLabel(charm: UserCharmSummary): string | null {
    if (!charm.firstFinalizedAt) return null;
    if (charm.isSettled) return "Settled";
    const settlesAt = new Date(new Date(charm.firstFinalizedAt).getTime() + 14 * 86400000);
    const daysLeft = Math.max(0, Math.ceil((settlesAt.getTime() - Date.now()) / 86400000));
    return `Settles in ${daysLeft}d`;
  }

  function statusBadgeClass(charm: UserCharmSummary): string {
    if (isCharmExpired(charm)) return "teAcctBadge teAcctBadge--expired";
    if (charm.isSettled) return "teAcctBadge teAcctBadge--settled";
    if (charm.status === "locked") return "teAcctBadge teAcctBadge--locked";
    if (charm.status === "active") return "teAcctBadge teAcctBadge--active";
    return "teAcctBadge teAcctBadge--configured";
  }

  function isCharmExpired(charm: UserCharmSummary): boolean {
    if (!charm.expiresAt) return false;
    return Date.now() > new Date(charm.expiresAt).getTime();
  }

  function isCharmFading(charm: UserCharmSummary): boolean {
    if (!charm.expiresAt || isCharmExpired(charm)) return false;
    const msLeft = new Date(charm.expiresAt).getTime() - Date.now();
    return msLeft <= 365 * 86400000;
  }

  function fadingLabel(charm: UserCharmSummary): string | null {
    if (!charm.expiresAt) return null;
    if (isCharmExpired(charm)) return "Expired";
    if (!isCharmFading(charm)) return null;
    const daysLeft = Math.ceil((new Date(charm.expiresAt).getTime() - Date.now()) / 86400000);
    return `Fading in ${daysLeft}d`;
  }

  function tierLabel(tier: string | null): string {
    if (!tier) return "";
    if (tier === "retail") return "Retail";
    return tier.replace("-", "-Year ").replace(/^\w/, (c) => c.toUpperCase()).replace(/ $/, "");
  }

  if (loading) {
    return (
      <div className="teAcctWrap">
        <div className="teAcctPanel">
          <div className="teAcctSection">
            <div style={{ textAlign: "center", padding: 20, fontSize: "var(--fs-meta)", opacity: 0.7 }}>
              Loading account...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="teAcctWrap">
        <div className="teAcctPanel">
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

          {/* Profile Section */}
          <div className="teAcctSection">
            <div className="teAcctSectionTitle">Profile</div>
            <div className="teAcctForm">
              {([
                { key: "firstName" as const, label: "Given Name", placeholder: "e.g., Elowen" },
                { key: "lastName" as const, label: "Family Name", placeholder: "e.g., Blackthorne" },
                { key: "address" as const, label: "Dwelling Place", placeholder: "e.g., 12 Hollow Lane" },
                { key: "email" as const, label: "Signal Address (Email)", placeholder: "captain@trianglesend.com" },
                { key: "cellNumber" as const, label: "Cipher Line", placeholder: "e.g., +1 555 012 3456" },
              ]).map(({ key, label, placeholder }) => (
                <ThemedInput
                  key={key}
                  label={label}
                  value={profile[key]}
                  onChange={(v) => setProfile((p) => ({ ...p, [key]: v }))}
                  disabled={busy}
                  placeholder={placeholder}
                />
              ))}
              <div>
                <button
                  className="teBtn teBtnPrimary"
                  onClick={handleSaveProfile}
                  disabled={busy || !profile.firstName.trim() || !profile.lastName.trim() || !profile.email.trim()}
                  type="button"
                >
                  {busy ? "Saving\u2026" : "Save Profile"}
                </button>
              </div>
            </div>
          </div>

          {/* Charms Section */}
          <div className="teAcctSection">
            <div className="teAcctSectionTitle">Your Charms</div>
            {charms.length === 0 ? (
              <div className="teAcctEmpty">
                No charms yet. Claim your first charm to see it here.
              </div>
            ) : (
              <div className="teAcctCharms">
                {charms.map((charm) => (
                  <div
                    key={charm.charmId}
                    className="teAcctCharmCard"
                    onClick={() => nav(`/account/charms/${encodeURIComponent(charm.charmId)}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") nav(`/account/charms/${encodeURIComponent(charm.charmId)}`);
                    }}
                  >
                    <div>
                      <div className="teAcctCharmName">
                        {charm.nickname || charm.charmId}
                      </div>
                      <div className="teAcctCharmMeta">
                        <span className={statusBadgeClass(charm)}>
                          {isCharmExpired(charm) ? "expired" : charm.isSettled ? "settled" : charm.status}
                        </span>
                        {charm.charmTier && <span>{tierLabel(charm.charmTier)}</span>}
                        {charm.memoryType && <span>{charm.memoryType}</span>}
                        <span>{charm.authMode === "glyph" ? "Glyph Lock" : "Open"}</span>
                        {settlingLabel(charm) && !charm.isSettled && (
                          <span>{settlingLabel(charm)}</span>
                        )}
                        {fadingLabel(charm) && (
                          <span className={isCharmExpired(charm) ? "teAcctBadge teAcctBadge--expired" : "teAcctBadge teAcctBadge--fading"}>
                            {fadingLabel(charm)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="teAcctCharmArrow">&rsaquo;</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="teAcctFooter">
            <Link to="/">Home</Link>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      {footerEl && createPortal(
        <div className="te-footerActions">
          <button
            className="teBtn teBtnSm teBtnGhost"
            onClick={() => nav("/")}
            type="button"
          >
            Home
          </button>
          <button
            className="teBtn teBtnSm teBtnGhost"
            onClick={doSignOut}
            disabled={working}
            type="button"
          >
            Sign out
          </button>
        </div>,
        footerEl
      )}
    </>
  );
}
