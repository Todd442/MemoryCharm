import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

import { loginRequest } from "../../../app/auth/msalConfig";
import { LandingHelix, type HelixCard } from "../components/LandingHelix";
import { NebulaBackground } from "../../playback/components/NebulaBackground";

import img00 from "../../../assets/gx_a3f8c21b.png";
import img01 from "../../../assets/gx_7d4e9f06.png";
import img02 from "../../../assets/gx_r6j3b5ht.png";
import img03 from "../../../assets/gx_w1c9g4ms.png";
import img04 from "../../../assets/gx_t8f2l6yn.png";
import img05 from "../../../assets/gx_h3q7x0kz.png";
import img06 from "../../../assets/gx_b5w9r2jp.png";
import img07 from "../../../assets/gx_n7d4v8fc.png";
import img08 from "../../../assets/gx_g2m6t1xq.png";
import img09 from "../../../assets/gx_y9k3h5bw.png";
import img10 from "../../../assets/gx_f4p8n0rd.png";
import img11 from "../../../assets/gx_x1j6c9mt.png";

import "./LandingPage.css";

const CARD_PALETTE = [
  "#5a3a1a", "#1a3a2e", "#1a2a4a", "#3a1a5a",
  "#5a1a2e", "#1a3a1a", "#3a1a1a", "#4a3a1a",
  "#1a3a3a", "#5a1a1a", "#3a4a1a", "#1a2a3a",
];

const HELIX_CARDS: HelixCard[] = [
  { id:  0, color: CARD_PALETTE[0],  imageSrc: img00 },
  { id:  1, color: CARD_PALETTE[1],  imageSrc: img01 },
  { id:  2, color: CARD_PALETTE[2],  imageSrc: img02 },
  { id:  3, color: CARD_PALETTE[3],  imageSrc: img03 },
  { id:  4, color: CARD_PALETTE[4],  imageSrc: img04 },
  { id:  5, color: CARD_PALETTE[5],  imageSrc: img05 },
  { id:  6, color: CARD_PALETTE[6],  imageSrc: img06 },
  { id:  7, color: CARD_PALETTE[7],  imageSrc: img07 },
  { id:  8, color: CARD_PALETTE[8],  imageSrc: img08 },
  { id:  9, color: CARD_PALETTE[9],  imageSrc: img09 },
  { id: 10, color: CARD_PALETTE[10], imageSrc: img10 },
  { id: 11, color: CARD_PALETTE[11], imageSrc: img11 },
];

export function LandingPage() {
  const nav = useNavigate();
  const { accounts, instance, inProgress } = useMsal();
  const [dimFactor, setDimFactor] = useState(0);

  const isAuthed  = accounts.length > 0;
  const working   = inProgress !== InteractionStatus.None;

  useEffect(() => {
    function onScroll() {
      const vh = window.innerHeight;
      // Begin dimming at 20% into hero scroll, complete by 80%
      const progress = Math.min(1, Math.max(0,
        (window.scrollY - vh * 0.2) / (vh * 0.6)
      ));
      setDimFactor(progress * 0.92);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleSignIn() {
    try {
      sessionStorage.setItem("mc.returnTo", "/account");
      localStorage.setItem("mc.returnTo", "/account");
      await instance.loginRedirect(loginRequest);
    } catch {
      // handled by MSAL
    }
  }

  return (
    <div className="lp-root">
      {/* Fixed backdrop — nebula behind, helix canvas in front */}
      <div className="lp-canvas-bg">
        <NebulaBackground />
        <LandingHelix cards={HELIX_CARDS} dimFactor={dimFactor} />
      </div>

      {/* Scrollable content — sits above canvas */}
      <div className="lp-scroll">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="lp-hero">
          {/* Subtitle — absolutely tracked just below canvas "Charm" */}
          <p
            className="lp-hero-sub"
            style={{ opacity: 1 - dimFactor }}
          >
            A Small Working of Purposeful Magic
          </p>
          <a className="lp-scroll-cue" href="#magic" aria-label="Scroll to learn more">
            <span className="lp-scroll-cue-line" />
          </a>
        </section>

        {/* ── What is magic? ───────────────────────────────────────────── */}
        <section className="lp-section lp-section--first" id="magic">
          <div className="lp-prose">
            <h2 className="lp-section-title">What is magic?</h2>
            <div className="lp-verse">
              <p>An invisible force, guided by symbols and gestures.</p>
              <p>
                A mark.<br />
                A motion.<br />
                A word spoken with intent.
              </p>
              <p>And suddenly something that was distant becomes present.</p>
            </div>
            <div className="lp-body">
              <p>If that is magic, then we live surrounded by it.</p>
              <p>
                Not the kind found in old books—<br />
                the kind hidden in plain sight,<br />
                inside the things we already carry.
              </p>
            </div>
          </div>
        </section>

        {/* ── The Unspoken Problem ─────────────────────────────────────── */}
        <section className="lp-section lp-section--problem">
          <div className="lp-prose">
            <h2 className="lp-section-title">The Unspoken Problem</h2>
            <div className="lp-body">
              <p>We have hundreds—thousands—of photographs and videos.</p>
              <p>They exist.</p>
              <p>Somewhere.</p>
              <p>
                In a pocket of glass.<br />
                In a folder with no name.<br />
                In a sea of scroll and search.
              </p>
              <p>
                And when the moment arrives—the real moment—<br />
                when your hand rests on an ornament from a long-ago winter,<br />
                when your eyes find a frame on the shelf,<br />
                when you think of a friend who's far away,<br />
                a loved one who isn't here anymore,<br />
                a dog that used to come running at the sound of your voice—
              </p>
              <p>the memory is there…</p>
              <p>but it isn't reachable.</p>
              <p>
                Not easily.<br />
                Not gently.<br />
                Not in the way memory deserves.
              </p>
            </div>
          </div>
        </section>

        {/* ── The Charm (how it works) — PLACEHOLDER ───────────────────── */}
        <section className="lp-section lp-section--charm">
          <div className="lp-prose">
            <h2 className="lp-section-title">The Answer</h2>
            <div className="lp-body lp-placeholder">
              <p>[How the charm is used — copy coming]</p>
              <p>
                A small object. A single tap.<br />
                The memory appears.
              </p>
              <p>
                No app. No account. No search.<br />
                Just the charm, and the phone already in your hand.
              </p>
            </div>
          </div>
        </section>

        {/* ── The Makers — PLACEHOLDER ─────────────────────────────────── */}
        <section className="lp-section lp-section--maker">
          <div className="lp-prose">
            <h2 className="lp-section-title">Where It's Made</h2>
            <div className="lp-body lp-placeholder">
              <p>[Who makes it and where — copy coming]</p>
              <p>
                Made by hand, with intention.<br />
                Each charm carries something of the place it came from.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="lp-section lp-section--cta">
          <div className="lp-cta">
            <h2 className="lp-cta-title">Begin</h2>

            {isAuthed ? (
              <>
                <p className="lp-cta-sub">Welcome back, Keeper.</p>
                <button
                  className="lp-cta-btn"
                  type="button"
                  onClick={() => nav("/account")}
                >
                  View Your Charms
                </button>
              </>
            ) : (
              <>
                <p className="lp-cta-sub">
                  Claim a charm.<br />Bind your first memory.
                </p>
                <button
                  className="lp-cta-btn"
                  type="button"
                  onClick={handleSignIn}
                  disabled={working}
                >
                  {working ? "Working…" : "Sign In"}
                </button>
              </>
            )}

            <p className="lp-cta-footer">
              Already have a charm?{" "}
              <a
                href="/c"
                onClick={e => { e.preventDefault(); nav("/c"); }}
              >
                Enter your charm code
              </a>
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
