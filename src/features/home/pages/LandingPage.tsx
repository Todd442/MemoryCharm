import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

import { loginRequest } from "../../../app/auth/msalConfig";
import { LandingHelix, type HelixCard } from "../components/LandingHelix";
import { NebulaBackground } from "../../playback/components/NebulaBackground";

import splash00 from "../../../assets/SplashScreenImages/IMG_1085.JPG";
import splash01 from "../../../assets/SplashScreenImages/IMG_1087.JPG";
import splash02 from "../../../assets/SplashScreenImages/IMG_1193.JPG";
import splash03 from "../../../assets/SplashScreenImages/IMG_1298.JPG";
import splash04 from "../../../assets/SplashScreenImages/IMG_1736.JPG";
import splash05 from "../../../assets/SplashScreenImages/IMG_2250.JPG";
import splash06 from "../../../assets/SplashScreenImages/IMG_2395.JPG";
import splash07 from "../../../assets/SplashScreenImages/IMG_2421.JPG";
import splash08 from "../../../assets/SplashScreenImages/IMG_3180.JPG";
import splash09 from "../../../assets/SplashScreenImages/20161014_191509.jpg";
import splash10 from "../../../assets/SplashScreenImages/20180123_132650.jpg";
import splash11 from "../../../assets/SplashScreenImages/20180123_080450.jpg";
import splash12 from "../../../assets/SplashScreenImages/20161215_195101.jpg";
import splash13 from "../../../assets/SplashScreenImages/20230825_140417.jpg";
import splash14 from "../../../assets/SplashScreenImages/20201007_170723.jpg";
import splash15 from "../../../assets/SplashScreenImages/20180610_122720.jpg";

import charmPhoto from "../../../assets/CharmPhoto.png";
import "./LandingPage.css";

// Fallback colour shown while each image loads
const CARD_PALETTE = [
  "#3a2a14", "#142a22", "#141e36", "#2a1440",
  "#3a1420", "#143a28", "#2a1414", "#362a14",
  "#143a3a", "#3a1414", "#283614", "#141e2a",
  "#2e1e0e", "#0e2e22", "#1a1a30", "#2a1028",
];

const HELIX_CARDS: HelixCard[] = [
  { id:  0, color: CARD_PALETTE[0],  imageSrc: splash00 },
  { id:  1, color: CARD_PALETTE[1],  imageSrc: splash01 },
  { id:  2, color: CARD_PALETTE[2],  imageSrc: splash02 },
  { id:  3, color: CARD_PALETTE[3],  imageSrc: splash03 },
  { id:  4, color: CARD_PALETTE[4],  imageSrc: splash04 },
  { id:  5, color: CARD_PALETTE[5],  imageSrc: splash05 },
  { id:  6, color: CARD_PALETTE[6],  imageSrc: splash06 },
  { id:  7, color: CARD_PALETTE[7],  imageSrc: splash07 },
  { id:  8, color: CARD_PALETTE[8],  imageSrc: splash08 },
  { id:  9, color: CARD_PALETTE[9],  imageSrc: splash09 },
  { id: 10, color: CARD_PALETTE[10], imageSrc: splash10 },
  { id: 11, color: CARD_PALETTE[11], imageSrc: splash11 },
  { id: 12, color: CARD_PALETTE[12], imageSrc: splash12 },
  { id: 13, color: CARD_PALETTE[13], imageSrc: splash13 },
  { id: 14, color: CARD_PALETTE[14], imageSrc: splash14 },
  { id: 15, color: CARD_PALETTE[15], imageSrc: splash15 },
];

export function LandingPage() {
  const nav = useNavigate();
  const { accounts, instance, inProgress } = useMsal();
  const [dimFactor, setDimFactor] = useState(0);
  const [navVisible, setNavVisible] = useState(false);

  const isAuthed  = accounts.length > 0;
  const working   = inProgress !== InteractionStatus.None;

  useEffect(() => {
    function onScroll() {
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0,
        (window.scrollY - vh * 0.2) / (vh * 0.6)
      ));
      setDimFactor(progress * 0.92);
      setNavVisible(window.scrollY > vh * 0.75);
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

      {/* Fixed context label — anchored to viewport bottom, fades on scroll */}
      <p className="lp-hero-context" style={{ opacity: (1 - dimFactor) * 0.55 }}>
        Real Memories bound to a charm.
      </p>

      {/* Floating nav — fades in once hero scrolls away */}
      <nav className={`lp-nav${navVisible ? " lp-nav--visible" : ""}`} aria-label="Site navigation">
        <span className="lp-nav-brand">MemoryCharm</span>
        <div className="lp-nav-right">
          <a
            href="/nfc-check"
            className="lp-nav-btn lp-nav-link"
            onClick={e => { e.preventDefault(); nav("/nfc-check"); }}
          >
            Charm help
          </a>
          {isAuthed ? (
            <button className="lp-nav-btn" type="button" onClick={() => nav("/account")}>
              Account
            </button>
          ) : (
            <button className="lp-nav-btn" type="button" onClick={handleSignIn} disabled={working}>
              {working ? "Working…" : "Sign In"}
            </button>
          )}
        </div>
      </nav>

      {/* Scrollable content — sits above canvas */}
      <div className="lp-scroll">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="lp-hero">
          <p className="lp-hero-sub" style={{ opacity: 1 - dimFactor }}>
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
          </div>
        </section>

        {/* ── The Unspoken Problem ─────────────────────────────────────── */}
        <section className="lp-section lp-section--problem">
          <div className="lp-prose">
            <h2 className="lp-section-title">The Unspoken Problem</h2>
            <div className="lp-body">
              <p>We have hundreds—thousands—of photographs and videos.</p>
              <p>They exist. Somewhere.</p>
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
            </div>
            <p className="lp-pullquote">
              the memory is there…<br />but it isn't reachable.
            </p>
            <div className="lp-body">
              <p>
                Not easily.<br />
                Not gently.<br />
                Not in the way memory deserves.
              </p>
            </div>
          </div>
        </section>

        {/* ── The Charm — product reveal ───────────────────────────────── */}
        <section className="lp-section lp-section--charm">
          <div className="lp-charm-reveal">
            <h2 className="lp-charm-name">The Charm</h2>
            <div className="lp-charm-rule" />
            <div className="lp-charm-cols">
              <div className="lp-charm-col">
                <h3 className="lp-charm-col-title">One Object</h3>
                <div className="lp-charm-col-rule" />
                <p className="lp-charm-col-body">
                  Small enough to keep.<br />
                  To wear.<br />
                  To give away.
                </p>
              </div>
              <div className="lp-charm-col">
                <h3 className="lp-charm-col-title">One Tap</h3>
                <div className="lp-charm-col-rule" />
                <p className="lp-charm-col-body">
                  Hold your phone near it.<br />
                  Nothing more.
                </p>
              </div>
              <div className="lp-charm-col">
                <h3 className="lp-charm-col-title">One Memory</h3>
                <div className="lp-charm-col-rule" />
                <p className="lp-charm-col-body">
                  The moment appears.<br />
                  No search.<br />
                  No scroll.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Flagship charm photo ─────────────────────────────────────── */}
        <section className="lp-section lp-section--flagship">
          <div className="lp-flagship">
            <img src={charmPhoto} alt="The MemoryCharm — a hand holding a golden charm" className="lp-flagship-img" />
            <p className="lp-flagship-caption">
              The Original MemoryCharm — handcrafted, NFC-encoded, yours.
            </p>
          </div>
        </section>

        {/* ── Help with the magic ──────────────────────────────────────── */}
        <section className="lp-section lp-section--magic" id="magic-help">
          <div className="lp-magic">
            <h2 className="lp-section-title">Charm not responding?</h2>
            <p className="lp-magic-intro">
              Our NFC guide detects your device, shows you exactly where to hold the charm,
              and runs a live tap test.
            </p>

            {/* Placeholder for future video -------------------------------- */}
            {/* <div className="lp-magic-video">[Video guide coming]</div> */}

            <div className="lp-magic-cta">
              <a
                href="/nfc-check"
                className="lp-cta-btn lp-magic-btn"
                onClick={e => { e.preventDefault(); nav("/nfc-check"); }}
              >
                Walk me through it
              </a>
            </div>
          </div>
        </section>

        {/* ── Lifetime & no subscription ───────────────────────────────── */}
        <section className="lp-section lp-section--lifetime">
          <div className="lp-prose">
            <h2 className="lp-section-title">Yours, For Years</h2>
            <div className="lp-verse">
              <p>
                You purchase a Memory Charm.<br />
                The memory is yours.
              </p>
              <p>
                Paid once.<br />
                No monthly bill arrives.<br />
                No renewal demanded before you are ready.
              </p>
            </div>
            <div className="lp-body">
              <p>
                Each charm holds its memory for a decade or more.
              </p>
              <p>
                Time begins to pass not when you purchase it &mdash;<br />
                but when you bind your memory to it.<br />
                A charm in a drawer, still unbound, is still waiting.
              </p>
            </div>
            <p className="lp-pullquote">
              Some things are meant to last a lifetime.<br />
              Some, just long enough.
            </p>
            <div className="lp-body">
              <p>
                When the time grows near for the memory to fade,
                we will let you know.
                You can renew it for another span &mdash;
                or let it go, as memories sometimes do.
              </p>
              <p>
                The charm remains yours, regardless.
                The object endures. The memory, while it lives,
                is held faithfully.
              </p>
            </div>
          </div>
        </section>

        {/* ── Where It's Made ──────────────────────────────────────────── */}
        <section className="lp-section lp-section--maker">
          <div className="lp-prose">
            <h2 className="lp-section-title">Why We Made It</h2>
            <div className="lp-body">
              <p>
                The maker spent three decades as a software architect &mdash;
                from the first web to the latest wave, building systems for
                companies across the world, watching an industry mistake
                complexity for progress and novelty for meaning.
              </p>
              <p>
                The promise of technology was always larger than what arrived.
                That it might close the distance between people. That it might
                make the world feel more alive.
              </p>
            </div>
            <p className="lp-pullquote">
              That promise, mostly, went unkept.
            </p>
            <div className="lp-body">
              <p>
                MemoryCharm is the answer to that. Built in Central Minnesota &mdash;
                a long way from the places that name themselves the future &mdash;
                because the technology was never the point.
              </p>
              <p>
                It is meant to disappear. What remains is the
                moment: a tap, a memory, a thing held in the hand.
              </p>
              <p>
                No trends pursued. No fads chased. No features added for their
                own sake.
              </p>
              <p>
                Only the quiet conviction that the world deserves more magic.<br />
                And that we are capable of making it.
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

        {/* ── Site footer ───────────────────────────────────────────────── */}
        <footer className="lp-footer">
          <a href="/faq" onClick={e => { e.preventDefault(); nav("/faq"); }}>
            FAQ
          </a>
          <span className="lp-footer-sep" aria-hidden="true">·</span>
          <a href="/terms" onClick={e => { e.preventDefault(); nav("/terms"); }}>
            Terms &amp; Conditions
          </a>
          <span className="lp-footer-sep" aria-hidden="true">·</span>
          <a href="/terms/plain" onClick={e => { e.preventDefault(); nav("/terms/plain"); }}>
            Plain English
          </a>
        </footer>

      </div>
    </div>
  );
}
