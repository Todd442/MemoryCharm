import React from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

import { loginRequest } from "../../../app/auth/msalConfig";
import { useStatus } from "../../../app/providers/StatusProvider";
import "../../claim/pages/ClaimCharmPage.css"; // shared .teBtn styles
import "./HomePage.css";

export function HomePage() {
  const nav = useNavigate();
  const { accounts, instance, inProgress } = useMsal();
  const { setStatus } = useStatus();

  const isAuthed = accounts.length > 0;
  const working = inProgress !== InteractionStatus.None;

  React.useEffect(() => {
    setStatus({ text: "Memory Charm", subtitle: "Timeless keepsakes, bound by craft." });
  }, [setStatus]);

  async function handleSignIn() {
    try {
      // Store returnTo so AuthGuard navigates to /account after sign-in
      sessionStorage.setItem("mc.returnTo", "/account");
      localStorage.setItem("mc.returnTo", "/account");
      await instance.loginRedirect(loginRequest);
    } catch {
      // handled by MSAL
    }
  }

  return (
    <div className="teHomeWrap">
      <div className="teHomePanel">
        <div className="teHomeHero">
          <h1 className="teHomeTitle">Memory Charm</h1>
          <p className="teHomeTagline">
            Bind your most treasured memories to a physical charm.
            Tap to unlock a video, image, or sound — sealed with
            a glyph only you know.
          </p>
        </div>

        <div className="teHomeFeatures">
          <div className="teHomeFeature">
            <div className="teHomeFeatureTitle">NFC-Powered Memories</div>
            <div className="teHomeFeatureDesc">
              Each charm carries an NFC tag. A single tap from any phone
              reveals the memory within — no app required.
            </div>
          </div>

          <div className="teHomeFeature">
            <div className="teHomeFeatureTitle">Glyph Protection</div>
            <div className="teHomeFeatureDesc">
              Choose a secret glyph to guard your memory. Only those who
              know the symbol can unlock what lies inside.
            </div>
          </div>

          <div className="teHomeFeature">
            <div className="teHomeFeatureTitle">A Memory That Settles</div>
            <div className="teHomeFeatureDesc">
              After two weeks your memory settles into the charm permanently,
              becoming an enduring keepsake that will not change.
            </div>
          </div>
        </div>

        <div className="teHomeCta">
          <div className="teHomeCtaText">
            {isAuthed
              ? "Welcome back, Keeper. View your charms and profile."
              : "Sign in to claim a charm and bind your first memory."}
          </div>

          {isAuthed ? (
            <button
              className="teBtn teBtnPrimary"
              onClick={() => nav("/account")}
              type="button"
            >
              View Account
            </button>
          ) : (
            <button
              className="teBtn teBtnPrimary"
              onClick={handleSignIn}
              disabled={working}
              type="button"
            >
              {working ? "Working\u2026" : "Sign In"}
            </button>
          )}
        </div>

        <div className="teHomeFooter">
          Already have a charm?{" "}
          <a href="/c" onClick={(e) => { e.preventDefault(); nav("/c"); }}>
            Enter your charm code
          </a>
        </div>
      </div>
    </div>
  );
}
