import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { acceptTerms } from "../../../app/api/profileApi";
import { consumeUlaReturnTo } from "../../../app/auth/RequireUla";
import "./LegalPage.css";
import "./TermsAcceptPage.css";

export function TermsAcceptPage() {
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      await acceptTerms();
      const returnTo = consumeUlaReturnTo() ?? "/account";
      navigate(returnTo, { replace: true });
    } catch {
      setError("Something went wrong. Please try again.");
      setAccepting(false);
    }
  }

  return (
    <div className="legal-root">
      <nav className="legal-nav">
        <span className="legal-nav__title">MemoryCharm</span>
      </nav>

      <article className="legal-article">
        <header className="legal-header">
          <h1 className="legal-title">Terms and Conditions</h1>
          <p className="legal-lead">
            Before you continue, please review and accept the MemoryCharm Terms
            and Conditions. You only need to do this once.
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
          <p>Following Activation, users may upload, replace, or modify media content for fourteen (14) calendar days ("Modification Window"). After expiration, media content becomes fixed and may not be replaced, edited, or altered through standard use of the Services.</p>
          <h3>6.2 Metadata Updates</h3>
          <p>After expiration of the Modification Window, users may update non-media descriptive elements such as memory title, text description, and display captions.</p>
          <h3>6.3 Optional Reopening</h3>
          <p>The Company may, at its sole discretion, offer paid services that temporarily reopen the Modification Window. Such services are not guaranteed, may vary by Charm Plan, and may be discontinued at any time.</p>
          <h3>6.4 User Responsibility</h3>
          <p>Users are responsible for reviewing and confirming uploaded media during the Modification Window. After expiration, the Company is not responsible for incorrect uploads, unintended versions, or formatting errors.</p>
        </section>

        <section className="legal-section">
          <h2>7. Access Method and Viewing Controls</h2>
          <h3>7.1 Viewing Access</h3>
          <p>Anyone with access to the charm or its viewing path may be able to view associated content unless optional viewing controls are enabled. The Company is not responsible for access resulting from intentional or unintentional sharing.</p>
          <h3>7.2 Optional Glyph Control</h3>
          <p>Certain Charm Plans allow activation of a visual glyph confirmation step before content is displayed. The glyph is not a password system or security guarantee.</p>
          <h3>7.3 Traffic and Abuse Controls</h3>
          <p>The Company may implement rate limits and automated abuse detection. Such controls do not constitute a defect or service failure.</p>
        </section>

        <section className="legal-section">
          <h2>8–19. Additional Terms</h2>
          <p>
            The full Terms and Conditions — including sections on Sustainability Funding, Customer
            Backups, Transferability, NFC Compatibility, Prohibited Content, Privacy, Warranty
            Disclaimer, Limitation of Liability, Indemnification, Force Majeure, Changes to Terms,
            and Governing Law — are available at{" "}
            <a className="legal-link" href="/terms" target="_blank" rel="noopener noreferrer">
              memorycharm.com/terms
            </a>
            .
          </p>
        </section>
      </article>

      <div className="ula-accept-footer">
        {error && <p className="ula-accept-error">{error}</p>}
        <p className="ula-accept-notice">
          By clicking Accept, you confirm you have read and agree to the Terms and Conditions.
        </p>
        <button
          className="ula-accept-btn"
          onClick={handleAccept}
          disabled={accepting}
        >
          {accepting ? "Saving…" : "I Accept"}
        </button>
      </div>
    </div>
  );
}
