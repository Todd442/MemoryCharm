import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, Link } from "react-router-dom";

import { getCharmDetail } from "../api";
import type { UserCharmDetail } from "../api";
import { useStatus } from "../../../app/providers/StatusProvider";
import "../../claim/pages/ClaimCharmPage.css"; // shared .teBtn styles
import "./PurchasePage.css";

export function PurchasePage() {
  const nav = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { setStatus } = useStatus();

  const [loading, setLoading] = useState(true);
  const [charm, setCharm] = useState<UserCharmDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setFooterEl(document.getElementById("te-footer"));
  }, []);

  useEffect(() => {
    setStatus({ text: "Charm Shop", subtitle: "Extend and enhance your memory charm." });
  }, [setStatus]);

  useEffect(() => {
    if (!code) return;
    async function load() {
      try {
        const detail = await getCharmDetail(code!);
        setCharm(detail);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load charm.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code]);

  function fmtDate(iso: string | null): string {
    if (!iso) return "\u2014";
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function tierLabel(tier: string | null): string {
    if (!tier) return "\u2014";
    if (tier === "retail") return "Retail (Perpetual)";
    return tier.replace("-", "-Year ").replace(/^\w/, (c) => c.toUpperCase()).replace(/ $/, "") + " Charm";
  }

  if (loading) {
    return (
      <div className="tePurchaseWrap">
        <div className="tePurchasePanel">
          <div className="tePurchaseSection">
            <div style={{ textAlign: "center", padding: 20, fontSize: 14, opacity: 0.7 }}>
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!charm) {
    return (
      <div className="tePurchaseWrap">
        <div className="tePurchasePanel">
          <div className="tePurchaseSection">
            <div style={{ textAlign: "center", padding: 20, fontSize: 14, opacity: 0.7 }}>
              Charm not found.
            </div>
          </div>
          <div className="tePurchaseNav">
            <Link to="/account">Back to Account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="tePurchaseWrap">
        <div className="tePurchasePanel">
          {err && (
            <div style={{
              margin: "0 0 12px",
              padding: "12px",
              borderRadius: 12,
              background: "rgba(220,0,0,0.08)",
              color: "#ff6a6a",
              border: "1px solid rgba(255,90,90,0.18)",
              fontSize: 14,
            }}>
              {err}
            </div>
          )}

          {/* Current charm summary */}
          <div className="tePurchaseSection">
            <div className="tePurchaseSectionTitle">Your Charm</div>
            <div className="tePurchaseCharmInfo">
              <div>
                <div className="tePurchaseCharmInfoLabel">Charm</div>
                <div>{charm.nickname || charm.charmId}</div>
              </div>
              <div>
                <div className="tePurchaseCharmInfoLabel">Tier</div>
                <div>{tierLabel(charm.charmTier)}</div>
              </div>
              <div>
                <div className="tePurchaseCharmInfoLabel">Expires</div>
                <div>{charm.expiresAt ? fmtDate(charm.expiresAt) : "Never"}</div>
              </div>
            </div>
          </div>

          {/* Purchase options */}
          <div className="tePurchaseSection">
            <div className="tePurchaseSectionTitle">Options</div>
            <div className="tePurchaseOptions">
              <div className="tePurchaseCard">
                <div className="tePurchaseCardTitle">Extend Memory</div>
                <div className="tePurchaseCardDesc">
                  Add 5 more years to this charm's lifespan.
                  Keep your memories alive longer.
                </div>
                <button className="tePurchaseCardBtn" disabled type="button">
                  Coming Soon
                </button>
              </div>

              <div className="tePurchaseCard">
                <div className="tePurchaseCardTitle">Upgrade Tier</div>
                <div className="tePurchaseCardDesc">
                  Upgrade to a 15-year or Retail charm for extended or perpetual memory preservation.
                </div>
                <button className="tePurchaseCardBtn" disabled type="button">
                  Coming Soon
                </button>
              </div>

              <div className="tePurchaseCard">
                <div className="tePurchaseCardTitle">Gift Wrap</div>
                <div className="tePurchaseCardDesc">
                  Send this charm as a gift with a personalized message sealed within.
                </div>
                <button className="tePurchaseCardBtn" disabled type="button">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>

          <div className="tePurchaseNav">
            <Link to={`/account/charms/${encodeURIComponent(charm.charmId)}`}>
              Back to Charm Details
            </Link>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      {footerEl && createPortal(
        <div className="te-footerActions">
          <button
            className="teBtn teBtnSm teBtnGhost"
            onClick={() => nav(`/account/charms/${encodeURIComponent(charm.charmId)}`)}
            type="button"
          >
            &larr; Charm Details
          </button>
          <button
            className="teBtn teBtnSm teBtnGhost"
            onClick={() => nav("/account")}
            type="button"
          >
            Account
          </button>
        </div>,
        footerEl
      )}
    </>
  );
}
