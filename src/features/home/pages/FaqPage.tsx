import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../legal/pages/LegalPage.css";

export function FaqPage() {
  const nav = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="legal-root">
      <nav className="legal-nav">
        <button className="legal-back" type="button" onClick={() => nav("/")}>
          ← MemoryCharm
        </button>
      </nav>

      <article className="legal-article">
        <header className="legal-header">
          <h1 className="legal-title">Frequently Asked Questions</h1>
          <p className="legal-subtitle">Everything you need to know about Memory Charm</p>
        </header>

        {/* ── What is it ─────────────────────────────────────────────── */}
        <details className="faq-item">
          <summary>What is a Memory Charm?</summary>
          <div className="faq-item-body">
            <p>
              A Memory Charm is a small, hand-crafted keepsake with an NFC chip embedded inside.
              NFC — Near Field Communication — is the same short-range wireless technology behind
              contactless payments and hotel key cards. It lets two devices exchange information
              the moment they touch, with no pairing, no Bluetooth, and no app required.
            </p>
            <p>
              Tap the charm with your phone and it opens a memory you've chosen — a video, a set
              of photos, or an audio recording — instantly in your browser.
            </p>
            <p>
              It's designed to be kept, worn, hung, or given away. The charm doesn't hold the memory — it calls it. A physical key to a moment kept just beyond the tangible world.
            </p>
          </div>
        </details>

        {/* ── Using It ───────────────────────────────────────────────── */}
        <details className="faq-item">
          <summary>How do I tap it?</summary>
          <div className="faq-item-body">
            <p>
              Hold the charm near the back of your phone. NFC antennas are usually near the top or
              center of the back panel — the exact spot varies by manufacturer.
            </p>
            <ul>
              <li><strong>iPhone</strong> — NFC is active by default. No setup required.</li>
              <li><strong>Android</strong> — NFC is usually on by default. If it doesn't respond, check Settings and confirm NFC is enabled.</li>
            </ul>
            <p>
              If you're not sure where your phone's antenna is, our{" "}
              <a href="/nfc-check" onClick={e => { e.preventDefault(); nav("/nfc-check"); }}>
                NFC guide
              </a>{" "}
              detects your device and shows you exactly where to hold the charm.
            </p>
          </div>
        </details>

        <details className="faq-item">
          <summary>Do I need to install an app?</summary>
          <div className="faq-item-body">
            <p>
              No. Tapping the charm opens directly in your phone's browser. No download, no pairing,
              no account required to view a memory.
            </p>
            <p>
              You only need an account if you're activating a charm and binding your own memory to it.
            </p>
          </div>
        </details>

        <details className="faq-item">
          <summary>My charm isn't responding. What do I do?</summary>
          <div className="faq-item-body">
            <p>
              The most common reason is antenna position — every phone hides its NFC antenna somewhere
              slightly different. Our{" "}
              <a href="/nfc-check" onClick={e => { e.preventDefault(); nav("/nfc-check"); }}>
                NFC guide
              </a>{" "}
              identifies your device, shows you exactly where to hold the charm, and runs a live tap
              test to confirm it's working.
            </p>
            <p>
              On Android, a magnetic phone case — the kind designed to let your phone cling to a car
              mount without a bracket — will silence the charm entirely. The magnets and metallic
              lining create a shield between the charm and the reader, and no amount of repositioning
              will overcome it. Remove the case, and the connection returns.
            </p>
          </div>
        </details>

        {/* ── The Object ─────────────────────────────────────────────── */}
        <details className="faq-item">
          <summary>How big is it?</summary>
          <div className="faq-item-body">
            <p>
              The charm is 1 inch wide, 1 inch tall, and 3/8 of an inch deep — roughly the size of
              a large coat button or a thick coin. Small enough to sit in a pocket. Light enough to
              hang on a Christmas tree alongside other ornaments without pulling the branch.
            </p>
          </div>
        </details>

        <details className="faq-item">
          <summary>What is it made of?</summary>
          <div className="faq-item-body">
            <p>
              Each charm is cast from a high-detail polymer resin — the same class of material used
              by professional miniature artists for precision work. That choice is intentional: this
              family of polymers introduces virtually no interference with the NFC chip inside,
              which means a reliable tap every time.
            </p>
            <p>
              It's also light enough to wear or hang without weight being a concern, and it holds
              fine surface detail well. Every charm is hand-assembled and hand-painted. The bail —
              the small loop at the top — is made from gold-plated brass.
            </p>
          </div>
        </details>

        {/* ── The Memory ─────────────────────────────────────────────── */}
        <details className="faq-item">
          <summary>What kind of memory can I store?</summary>
          <div className="faq-item-body">
            <p>When you activate a charm, you choose one memory type:</p>
            <ul>
              <li><strong>Video</strong> — a single video clip</li>
              <li><strong>Photos</strong> — a collection of up to 10 images displayed as a gallery</li>
              <li><strong>Audio</strong> — a recording that plays when the charm is tapped</li>
            </ul>
          </div>
        </details>

        <details className="faq-item">
          <summary>Are there file size limits?</summary>
          <div className="faq-item-body">
            <p>Yes, and they're set deliberately.</p>
            <p>
              A Memory Charm is designed to hold a single, chosen moment — not a full archive. When
              someone taps the charm, the memory should open quickly and play without hesitation. The
              limits exist to protect that experience.
            </p>
            <ul>
              <li><strong>Video:</strong> up to 200 MB. For the best experience, 30 seconds or less is recommended — short enough to feel immediate, long enough to carry real weight.</li>
              <li><strong>Photos:</strong> up to 10 images, with a combined size of up to 40 MB.</li>
              <li><strong>Audio:</strong> up to 50 MB. Up to 60 seconds is recommended.</li>
            </ul>
            <p>
              The constraint is part of the design. Choosing one clip, one collection, or one recording
              — and choosing it well — is what gives a charm its meaning.
            </p>
          </div>
        </details>

        <details className="faq-item">
          <summary>Can I change the memory after I set it?</summary>
          <div className="faq-item-body">
            <p>
              For the first 14 days after activation, the memory stays editable. You can replace
              the media, update the title, or change sharing settings.
            </p>
            <p>
              After 14 days, the media seals. The title and description remain editable, but the
              underlying file does not change. That's intentional — a Memory Charm is meant to
              preserve a moment, not serve as an endlessly revised cloud folder.
            </p>
          </div>
        </details>

        <details className="faq-item">
          <summary>Who can see my memory?</summary>
          <div className="faq-item-body">
            <p>
              By default, anyone who taps the charm — or has access to its link — can view the
              memory. That simplicity is part of what makes it feel like a physical object rather
              than an account.
            </p>
            <p>
              If you'd like a small layer of intentional access before the memory reveals itself,
              some charm plans allow you to enable a glyph — a brief visual step the viewer completes
              before the memory opens. It isn't a password; it's a pause.
            </p>
          </div>
        </details>

        {/* ── Hosting & Subscription ──────────────────────────────────── */}
        <details className="faq-item">
          <summary>How long does the memory last? Is there a subscription?</summary>
          <div className="faq-item-body">
            <p>
              No subscription. You pay once when you purchase the charm — nothing recurring arrives
              after that.
            </p>
            <p>
              Each charm includes a defined hosting period that begins when you activate it, not when
              you purchase it. An unactivated charm sitting in a drawer hasn't started counting down.
              Standard charms include ten years of hosting; extended-lifetime charms include fifteen.
              The exact period for your charm is shown at activation.
            </p>
            <p>
              As your charm's period approaches its end, we'll notify you. At that point you can
              renew the memory for another span — or let it go. The charm itself remains yours
              regardless. The object doesn't expire; the hosted memory does.
            </p>
            <p>
              Throughout the hosting period, your original uploaded file is kept on hand so you're
              never locked out of what you gave us.
            </p>
          </div>
        </details>

        {/* ── Purchasing ─────────────────────────────────────────────── */}
        <details className="faq-item">
          <summary>Where can I get one?</summary>
          <div className="faq-item-body">
            <p>
              Memory Charm is still in its early days. If you have a charm in hand, you're already
              holding something made in a small batch from Central Minnesota. Tap it to begin.
            </p>
            <p>
              If you have a question that isn't answered here, reach out — we're a small operation
              and we read every message.
            </p>
          </div>
        </details>

      </article>
    </div>
  );
}
