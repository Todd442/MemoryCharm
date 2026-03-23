import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { getUserMe, saveProfile, getUserCharms } from "../api";
import type { UserProfile, UserCharmSummary } from "../api";
import { useStatus } from "../../../app/providers/StatusProvider";
import { ThemedInput } from "../../../components/ThemedInput";
import "../../claim/pages/ClaimCharmPage.css"; // shared .teBtn styles
import "./AccountPage.css";

export function AccountPage() {
  const nav = useNavigate();
  const { setStatus } = useStatus();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    address: "",
    email: "",
    cellNumber: "",
  });
  const [charms, setCharms] = useState<UserCharmSummary[]>([]);

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
                        {charm.memoryName || charm.charmId}
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

          {/* Profile Section */}
          <div className="teAcctSection">
            <div className="teAcctSectionTitle">Profile</div>
            <div className="teAcctForm">
              {([
                { key: "firstName"  as const, label: "First Name",      placeholder: "e.g., Elowen",              hint: "" },
                { key: "lastName"   as const, label: "Last Name",       placeholder: "e.g., Blackthorne",         hint: "" },
                { key: "address"    as const, label: "Mailing Address", placeholder: "e.g., 123 Main Street",     hint: "Used for warranty fulfilment, legal notices, and ownership verification." },
                { key: "email"      as const, label: "Email",           placeholder: "e.g., you@email.com",       hint: "We'll send a confirmation to this address." },
                { key: "cellNumber" as const, label: "Phone",           placeholder: "e.g., +1 555 012 3456",    hint: "Used for ownership verification and as a backup contact for critical service notices." },
              ]).map(({ key, label, placeholder, hint }) => (
                <ThemedInput
                  key={key}
                  label={label}
                  value={profile[key]}
                  onChange={(v) => setProfile((p) => ({ ...p, [key]: v }))}
                  disabled={busy}
                  placeholder={placeholder}
                  hint={hint || undefined}
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

        </div>
      </div>

    </>
  );
}
