import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LegalPage.css";

export function TermsPage() {
  const nav = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="legal-root">
      <nav className="legal-nav">
        <button className="legal-back" type="button" onClick={() => nav("/")}>
          ← MemoryCharm
        </button>
        <a className="legal-switch" href="/terms/plain" onClick={e => { e.preventDefault(); nav("/terms/plain"); }}>
          Plain English version
        </a>
      </nav>

      <article className="legal-article">
        <header className="legal-header">
          <h1 className="legal-title">Terms and Conditions</h1>
          <p className="legal-updated">Last Updated: [Insert Date]</p>
          <p className="legal-lead">
            These Terms and Conditions ("Terms") govern your purchase, activation, and use of the
            Memory Charm physical product and associated digital services (collectively, the
            "Services") provided by [Company Name] ("Company," "we," "us," or "our").
          </p>
          <p className="legal-lead">
            By purchasing, activating, accessing, or using a Memory Charm, you agree to these Terms.
          </p>
        </header>

        <section className="legal-section">
          <h2>1. Product Overview</h2>
          <p>
            Memory Charm is a physical NFC-enabled keepsake that provides access to digital content
            hosted by or on behalf of the Company.
          </p>
          <p>
            The charm stores a link or identifier. Associated media files are hosted on
            Company-managed or third-party infrastructure.
          </p>
          <p>
            Memory Charm is designed as a memory preservation and presentation tool. It is not
            intended to function as a general-purpose cloud storage, backup, or continuous media
            editing service.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Accounts and Activation</h2>
          <h3>2.1 Account Required for Activation and Administration</h3>
          <p>Activation and administrative control of a Memory Charm require creation of a user account. An account allows you to:</p>
          <ul>
            <li>Activate a Memory Charm</li>
            <li>Upload and manage media during the Modification Window</li>
            <li>Configure optional viewing controls</li>
            <li>Update metadata (such as title and description)</li>
            <li>Manage charm settings</li>
          </ul>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.</p>
          <h3>2.2 Viewing Without Accounts</h3>
          <p>General viewing of a Memory Charm does not require a viewer account unless optional viewing controls are enabled under the applicable Charm Plan.</p>
        </section>

        <section className="legal-section">
          <h2>3. User Representations and Content Responsibility</h2>
          <p>You must be at least 18 years of age to upload or manage media.</p>
          <p>By uploading or associating content with a Memory Charm, you represent and warrant that:</p>
          <ul>
            <li>You have all rights necessary to upload and share the content.</li>
            <li>The content does not infringe intellectual property or privacy rights.</li>
            <li>The content complies with applicable laws.</li>
          </ul>
          <p>You are solely responsible for your content.</p>
        </section>

        <section className="legal-section">
          <h2>4. Charm Plans and Hosting Commitment Period</h2>
          <h3>4.1 Charm Plans</h3>
          <p>Memory Charm products are offered under different service tiers ("Charm Plans"). Each Charm Plan may include:</p>
          <ul>
            <li>A defined hosting duration ("Hosting Commitment Period")</li>
            <li>Applicable storage limits</li>
            <li>Feature availability</li>
            <li>Optional viewing controls</li>
            <li>Any additional services</li>
          </ul>
          <p>The specific Charm Plan and its details ("Plan Details") are disclosed at or before activation and may appear on packaging, product listings, or within the activation interface.</p>
          <h3>4.2 Activation Date</h3>
          <p>The Hosting Commitment Period begins on the date the Memory Charm is first activated ("Activation Date"), not the purchase date.</p>
          <h3>4.3 Plan Stability</h3>
          <p>The Plan Details presented at activation control in the event of any conflict with marketing or third-party descriptions. The Company may make changes required for security, legal compliance, infrastructure sustainability, or platform integrity.</p>
        </section>

        <section className="legal-section">
          <h2>5. Hosting Commitment</h2>
          <h3>5.1 Service Commitment</h3>
          <p>During the applicable Hosting Commitment Period, the Company will use commercially reasonable efforts to provide access to hosted content associated with the activated Memory Charm. Uninterrupted, error-free, or permanent availability is not guaranteed.</p>
          <h3>5.2 Permitted Modifications</h3>
          <p>The Company may modify, update, replace, or migrate hosting providers, storage infrastructure, file formats, delivery methods, URLs, security systems, and user interfaces to maintain viability, compliance, security, performance, or sustainability. The Company is not required to maintain any specific feature, interface, or technology.</p>
        </section>

        <section className="legal-section">
          <h2>6. Content Modification Window and Freeze</h2>
          <h3>6.1 Fourteen-Day Modification Window</h3>
          <p>Following Activation, users may upload, replace, or modify media content for fourteen (14) calendar days ("Modification Window"). After expiration, media content becomes fixed and may not be replaced, edited, or altered through standard use of the Services. The inability to modify media content after expiration shall not constitute a defect, service failure, or breach of these Terms.</p>
          <h3>6.2 Metadata Updates</h3>
          <p>After expiration of the Modification Window, users may update non-media descriptive elements such as memory title, text description, and display captions.</p>
          <h3>6.3 Optional Reopening</h3>
          <p>The Company may, at its sole discretion, offer paid services that temporarily reopen the Modification Window. Such services are not guaranteed, may vary by Charm Plan, may be discontinued at any time, and are subject to additional terms. Nothing in these Terms creates a right to reopen media after expiration of the Modification Window.</p>
          <h3>6.4 User Responsibility</h3>
          <p>Users are responsible for reviewing and confirming uploaded media during the Modification Window. After expiration, the Company is not responsible for incorrect uploads, unintended versions, formatting errors, or file selection mistakes.</p>
        </section>

        <section className="legal-section">
          <h2>7. Access Method and Viewing Controls</h2>
          <h3>7.1 Viewing Access</h3>
          <p>Memory Charm provides access to associated content through a web-based viewing experience triggered by the charm. Anyone with access to the charm or its viewing path may be able to view associated content unless optional viewing controls are enabled. The Company is not responsible for access resulting from intentional or unintentional sharing by the user or third parties.</p>
          <h3>7.2 Optional Glyph Control</h3>
          <p>Certain Charm Plans allow activation of a visual glyph confirmation step before content is displayed. The glyph is intended to introduce intentional access friction. It is not a password system, authentication mechanism, encryption system, or security guarantee.</p>
          <h3>7.3 Traffic and Abuse Controls</h3>
          <p>To protect system integrity and availability, the Company may implement rate limits, automated abuse detection, and other safeguards. These safeguards may temporarily restrict access in cases of excessive, automated, or suspicious traffic. Such restrictions do not constitute a defect or service failure. The Company does not guarantee prevention of unauthorized or automated access.</p>
        </section>

        <section className="legal-section">
          <h2>8. Sustainability Funding</h2>
          <p>The Company may allocate a portion of product revenue to support hosting and infrastructure during Hosting Commitment Periods. Any such allocation is an internal business practice and does not create a trust, escrow account, fiduciary obligation, or segregated fund for any individual customer.</p>
        </section>

        <section className="legal-section">
          <h2>9. Customer Backups</h2>
          <p>Users are responsible for maintaining independent backups of their media. The Services are not guaranteed to function as the sole archival repository of important data.</p>
        </section>

        <section className="legal-section">
          <h2>10. Transferability</h2>
          <p>Charm Plans follow the physical Memory Charm. Anyone in possession of the charm may be able to access associated content unless optional viewing controls are enabled. The Company is not responsible for unauthorized access resulting from loss, theft, or transfer of the physical charm.</p>
        </section>

        <section className="legal-section">
          <h2>11. NFC and Device Compatibility</h2>
          <p>The Company does not guarantee compatibility with all devices, operating systems, browsers, or NFC implementations. Device updates or manufacturer changes may affect performance.</p>
        </section>

        <section className="legal-section">
          <h2>12. Prohibited Content</h2>
          <p>Users may not upload content that infringes intellectual property rights, violates applicable law, is defamatory, harmful, obscene, or exploitative, or contains malware or malicious code. The Company may remove content that violates these Terms.</p>
        </section>

        <section className="legal-section">
          <h2>13. Privacy</h2>
          <p>The Company collects only information reasonably necessary to operate the Services. Uploaded content is processed solely to provide the Services and is not sold for advertising purposes.</p>
        </section>

        <section className="legal-section">
          <h2>14. Warranty Disclaimer</h2>
          <p>To the maximum extent permitted by law, Memory Charm and the Services are provided "as is" and "as available," without warranties of any kind, express or implied.</p>
        </section>

        <section className="legal-section">
          <h2>15. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, the Company shall not be liable for indirect, incidental, consequential, special, exemplary, or punitive damages, including loss of data, loss of content, loss of sentimental value, emotional distress, or goodwill.</p>
          <p>The Company's total liability for any claim relating to a Memory Charm or the Services shall not exceed the amount paid for the specific Memory Charm giving rise to the claim.</p>
        </section>

        <section className="legal-section">
          <h2>16. Indemnification</h2>
          <p>You agree to indemnify and hold harmless the Company from claims arising from your content or violation of these Terms.</p>
        </section>

        <section className="legal-section">
          <h2>17. Force Majeure</h2>
          <p>The Company is not responsible for delays or failures caused by events beyond its reasonable control, including infrastructure failures, cloud provider outages, cyberattacks, regulatory changes, natural disasters, or other force majeure events.</p>
        </section>

        <section className="legal-section">
          <h2>18. Changes to Terms</h2>
          <p>The Company may update these Terms periodically. Continued use of the Services after updates constitutes acceptance of revised Terms.</p>
        </section>

        <section className="legal-section">
          <h2>19. Governing Law</h2>
          <p>These Terms are governed by the laws of the State of Minnesota, without regard to conflict-of-law principles.</p>
        </section>
      </article>
    </div>
  );
}
