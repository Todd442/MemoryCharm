import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LegalPage.css";

export function PlainTermsPage() {
  const nav = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="legal-root">
      <nav className="legal-nav">
        <button className="legal-back" type="button" onClick={() => nav("/")}>
          ← MemoryCharm
        </button>
        <a className="legal-switch" href="/terms" onClick={e => { e.preventDefault(); nav("/terms"); }}>
          Full legal terms
        </a>
      </nav>

      <article className="legal-article">
        <header className="legal-header">
          <h1 className="legal-title">The Human Translation</h1>
          <p className="legal-subtitle">A Plain-English Guide to Our Terms</p>
          <blockquote className="legal-disclaimer">
            This is a plain-language summary of our official Terms and Conditions.
            It is provided for clarity and convenience.
            <br /><br />
            It does not replace or modify the legal Terms.
            If there is ever a difference between this guide and the official Terms, the legal Terms control.
          </blockquote>
        </header>

        <section className="legal-section">
          <h2>What Memory Charm Is</h2>
          <p>Memory Charm is a physical keepsake that connects to a hosted digital memory.</p>
          <p>The charm itself carries a path. The memory lives on infrastructure we maintain.</p>
          <p>It is designed to preserve and present a moment — not to function as a general cloud storage system or continuously edited media platform.</p>
        </section>

        <section className="legal-section">
          <h2>Accounts and Setup</h2>
          <p>To activate and manage your charm, you create an account. That account allows you to:</p>
          <ul>
            <li>Activate the charm</li>
            <li>Upload your media</li>
            <li>Shape the memory during the 14-day window</li>
            <li>Enable optional viewing controls</li>
            <li>Update titles and descriptions</li>
          </ul>
          <p>People who simply tap and view your charm do not need an account (unless you've enabled certain viewing controls).</p>
          <p>You're responsible for keeping your account secure.</p>
        </section>

        <section className="legal-section">
          <h2>Hosting Duration</h2>
          <p>Each charm includes a defined hosting period based on its specific plan.</p>
          <p>That hosting period begins when you activate the charm — not when you purchase it.</p>
          <p>During that time, we use commercially reasonable efforts to keep your memory accessible.</p>
          <p>Like any online service, we cannot promise uninterrupted or perfect availability — but careful stewardship of the system is central to how we operate.</p>
          <p>We may update or improve the underlying technology over time to keep things sustainable and functional.</p>
        </section>

        <section className="legal-section">
          <h2>The 14-Day Memory Window</h2>
          <p>After activation, you have fourteen (14) calendar days to upload, replace, or modify the media associated with your charm.</p>
          <p>After those fourteen days, the media becomes fixed.</p>
          <p>That freeze is intentional. Memory Charm is designed to preserve a defined moment — not to support endless revision.</p>
          <p>You may still update:</p>
          <ul>
            <li>The memory's name</li>
            <li>Its written description</li>
            <li>Display captions</li>
          </ul>
          <p>But the media file itself does not change.</p>
          <p>The inability to edit media after the window closes is not considered a defect or malfunction.</p>
        </section>

        <section className="legal-section">
          <h2>Can a Frozen Memory Be Reopened?</h2>
          <p>Possibly — but not automatically.</p>
          <p>At our sole discretion, we may offer a paid option to temporarily reopen editing.</p>
          <p>This is:</p>
          <ul>
            <li>Not guaranteed</li>
            <li>Not always available</li>
            <li>Subject to additional terms</li>
            <li>Subject to change or discontinuation</li>
          </ul>
          <p>There is no built-in right to reopen a sealed memory.</p>
        </section>

        <section className="legal-section">
          <h2>Viewing and Sharing</h2>
          <p>Memory Charm opens a web-based viewing experience when tapped with a compatible device.</p>
          <p>If someone has access to the charm — or the viewing path it opens — they may be able to see the memory. That simplicity is part of the design.</p>
          <p>Some charm plans allow you to enable a visual "glyph" step before the memory reveals itself.</p>
          <p>The glyph is not a password system or security guarantee. It is a small layer of intentional access — a pause before viewing.</p>
          <p>You decide how and when to share access.</p>
        </section>

        <section className="legal-section">
          <h2>Traffic Limits and System Protections</h2>
          <p>To protect the system from abuse, scraping, or excessive automated traffic, we may implement safeguards such as rate limits or automated detection tools.</p>
          <p>In rare cases, repeated or unusual activity may temporarily restrict viewing.</p>
          <p>These protections are not considered a defect or service failure.</p>
          <p>No online system can guarantee prevention of all unauthorized or automated access.</p>
        </section>

        <section className="legal-section">
          <h2>Keep Your Own Backup</h2>
          <p>Always keep your own copy of important media.</p>
          <p>Memory Charm is meant to preserve and present your chosen moment — but it should not replace your personal archives.</p>
        </section>

        <section className="legal-section">
          <h2>If We Ever Discontinue Hosting</h2>
          <p>If we ever discontinue hosting generally or for a specific charm plan, we will, when commercially practicable:</p>
          <ul>
            <li>Provide advance notice, and</li>
            <li>Provide a reasonable opportunity to download or export your memory.</li>
          </ul>
          <p>We are not required to provide an identical replacement service.</p>
        </section>

        <section className="legal-section">
          <h2>Sustainability</h2>
          <p>We may allocate a portion of product revenue to support hosting and infrastructure during each charm's defined hosting period.</p>
          <p>This is an internal business practice and does not create a separate escrow or dedicated fund for individual customers.</p>
        </section>

        <section className="legal-section">
          <h2>Device Compatibility</h2>
          <p>Memory Charm relies on NFC technology supported by compatible devices.</p>
          <p>Not all devices behave identically, and manufacturer updates may affect compatibility.</p>
          <p>We cannot guarantee compatibility with every device or operating system.</p>
        </section>

        <section className="legal-section">
          <h2>If the Charm Is Lost or Transferred</h2>
          <p>Charm plans follow the physical charm.</p>
          <p>Anyone in possession of the charm may be able to access the memory unless optional controls are enabled.</p>
          <p>We are not responsible for access resulting from loss, theft, or transfer of the physical charm.</p>
        </section>

        <section className="legal-section">
          <h2>Limits on Liability</h2>
          <p>If something goes wrong, our total liability is limited to the amount paid for the specific charm involved.</p>
          <p>We are not liable for:</p>
          <ul>
            <li>Loss of data</li>
            <li>Loss of content</li>
            <li>Loss of sentimental value</li>
            <li>Emotional distress</li>
            <li>Indirect or consequential damages</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Changes to the Terms</h2>
          <p>We may update our Terms from time to time. Continued use of the Services means you accept the updated Terms.</p>
        </section>

        <section className="legal-section">
          <h2>Governing Law</h2>
          <p>The official Terms are governed by the laws of the State of Minnesota.</p>
        </section>

        <section className="legal-section legal-section--final">
          <h2>A Final Note</h2>
          <p>Memory Charm is built to make a chosen moment reachable.</p>
          <p>It is designed with intention: a defined hosting period, a defined editing window, a physical anchor for something invisible.</p>
          <p>
            For the complete legal details, please refer to the{" "}
            <a href="/terms" onClick={e => { e.preventDefault(); nav("/terms"); }}>
              official Terms and Conditions
            </a>.
          </p>
        </section>
      </article>
    </div>
  );
}
