import "../pages/LegalPage.css";

/**
 * UlaContent — shared ULA article body.
 * Used in both TermsAcceptPage (standalone) and ClaimCharmPage (inline step).
 * Pass compact={true} when rendering inside a card step to reduce padding.
 */
export function UlaContent({ compact }: { compact?: boolean }) {
  return (
    <article className={compact ? "legal-article legal-article--compact" : "legal-article"}>
      <header className="legal-header">
        <h1 className="legal-title">User License Agreement</h1>
        <p className="legal-updated">Last Updated: [Insert Date]</p>
        <p className="legal-lead">
          Welcome to Memory Charm™. This agreement explains how the Memory Charm product and
          related digital services work, what you can expect from us, and what we expect from you.
        </p>
        <p className="legal-lead">
          We've written this in plain English because we believe in clarity. That said, this is
          still a legal agreement.
        </p>
        <p className="legal-lead">
          By activating, scanning, or using a Memory Charm, you agree to these terms.
        </p>
      </header>

      <section className="legal-section">
        <h2>1. What You're Getting</h2>
        <p>When you purchase a Memory Charm, you are receiving:</p>
        <ul>
          <li>A physical NFC-enabled charm</li>
          <li>Access to associated digital hosting services</li>
          <li>The ability to upload and share personal memories (video, image, audio, or text)</li>
          <li>A limited license to use the Memory Charm software platform</li>
        </ul>
        <p>You are <strong>not</strong> purchasing ownership of the software platform or underlying infrastructure.</p>
      </section>

      <section className="legal-section">
        <h2>2. License Grant</h2>
        <p>We grant you a <strong>non-exclusive, non-transferable license</strong> to use the Memory Charm platform solely for personal, non-commercial use.</p>
        <p>You may:</p>
        <ul>
          <li>Upload your own content</li>
          <li>Share your charm with friends and family</li>
          <li>Gift a charm to someone else</li>
        </ul>
        <p>You may not:</p>
        <ul>
          <li>Reverse engineer the software</li>
          <li>Resell access to the hosting service</li>
          <li>Use the platform for illegal, harmful, or abusive content</li>
          <li>Attempt to bypass usage limits or service protections</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>3. Your Content</h2>
        <p>You retain ownership of the content you upload.</p>
        <p>By uploading content, you grant us a limited license to:</p>
        <ul>
          <li>Store it</li>
          <li>Secure it</li>
          <li>Deliver it when the charm is scanned</li>
          <li>Back it up for service continuity</li>
        </ul>
        <p>We do <strong>not</strong> sell your content. We do <strong>not</strong> claim ownership of your memories.</p>
        <p>You are responsible for ensuring you have the right to upload any content (e.g., no copyrighted movies, no content you don't have rights to). You must be at least 18 years of age to upload or manage media.</p>
      </section>

      <section className="legal-section">
        <h2>4. Hosting &amp; Service Duration</h2>
        <p>Memory Charm includes digital hosting for a defined service period ("Hosting Commitment Period") disclosed at activation. This period is the lifespan of the memory — it is finite by design.</p>
        <p>The Hosting Commitment Period begins on the date the Memory Charm is first activated, not the purchase date.</p>
        <p>At the end of the Hosting Commitment Period:</p>
        <ul>
          <li>Hosted content will expire and may no longer be accessible.</li>
          <li>This is the intended behaviour of the product, not a failure of service.</li>
          <li>We may offer renewal options to extend the period before it expires.</li>
        </ul>
        <p>We will make reasonable efforts to notify you as your service period approaches its end so you have the opportunity to renew or download your content.</p>
        <p>We reserve the right to discontinue service if the platform becomes technically or economically unviable, or if laws or regulations require changes.</p>
      </section>

      <section className="legal-section">
        <h2>5. Content Modification Window</h2>
        <p>After activation, you may upload, replace, or modify media content for fourteen (14) calendar days. After this period, media becomes fixed and cannot be replaced or edited through standard use of the service.</p>
        <p>After the window closes, you may still update non-media elements such as memory title, text description, and display captions.</p>
        <p>You are responsible for reviewing and confirming uploaded media during this window. After it closes, we are not responsible for incorrect uploads, unintended versions, or formatting errors.</p>
      </section>

      <section className="legal-section">
        <h2>6. Privacy &amp; Data</h2>
        <p>We collect only the data necessary to operate the service.</p>
        <p>We do not:</p>
        <ul>
          <li>Sell personal data</li>
          <li>Track users beyond what is necessary for security and service reliability</li>
        </ul>
        <p>Technical logs (such as scan timestamps or device types) may be collected for security and performance monitoring. Full details are in our Privacy Policy.</p>
        <h3>Why We Ask for Your Address and Phone Number</h3>
        <p>We collect a mailing address and phone number for the following specific purposes:</p>
        <ul>
          <li><strong>Ownership verification.</strong> If you contact support to recover access, dispute a claim, or request account changes, your address and phone number help us confirm you are the legitimate owner of a charm.</li>
          <li><strong>Copyright and legal contact.</strong> Under the Digital Millennium Copyright Act (DMCA) and applicable law, we may be required to contact you in connection with copyright complaints or legal notices relating to content you have uploaded. A physical address and phone number are standard requirements for these processes.</li>
          <li><strong>Critical service notifications.</strong> We commit to notifying you before your Hosting Commitment Period expires and before any service discontinuation. While email is our primary channel, a phone number and mailing address provide reliable backup contact methods for notices that could affect your memories.</li>
          <li><strong>Warranty fulfilment.</strong> If your physical charm is eligible for replacement under the manufacturing defect warranty, a mailing address is required to ship a replacement.</li>
        </ul>
        <p>These fields are not used for marketing. We will not share them with third parties except as required by law or as necessary to fulfil the purposes above.</p>
      </section>

      <section className="legal-section">
        <h2>7. Acceptable Use</h2>
        <p>You agree not to upload:</p>
        <ul>
          <li>Illegal content</li>
          <li>Explicit content involving minors</li>
          <li>Malware or harmful code</li>
          <li>Content intended to harass or threaten others</li>
          <li>Content that infringes intellectual property or privacy rights</li>
        </ul>
        <p>We reserve the right to remove content that violates these standards.</p>
      </section>

      <section className="legal-section">
        <h2>8. NFC &amp; Device Compatibility</h2>
        <p>Memory Charms rely on NFC-capable devices. We cannot guarantee compatibility with every phone or device model. Users are responsible for enabling NFC functionality and understanding their device settings. We are not responsible for device-specific limitations.</p>
      </section>

      <section className="legal-section">
        <h2>9. Warranty Disclaimer</h2>
        <p>Memory Charm is provided "as is" and "as available." While we strive for reliability, we do not guarantee uninterrupted service. We recommend keeping your own backup of uploaded content.</p>
        <p>The physical charm is warranted against manufacturing defects for [X] days from purchase.</p>
        <p>To the maximum extent permitted by law, Memory Charm and the services are provided without warranties of any kind, express or implied.</p>
      </section>

      <section className="legal-section">
        <h2>10. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law:</p>
        <ul>
          <li>We are not liable for indirect, incidental, or consequential damages</li>
          <li>Our total liability shall not exceed the purchase price of the charm</li>
        </ul>
        <p>This includes lost data, emotional distress, and third-party misuse of shared links.</p>
      </section>

      <section className="legal-section">
        <h2>11. Transfer &amp; Gifting</h2>
        <p>If you gift a charm, the recipient becomes the user of record upon activation. The original purchaser no longer retains access rights unless explicitly shared.</p>
        <p>Anyone in possession of the charm may be able to access associated content unless optional viewing controls are enabled.</p>
      </section>

      <section className="legal-section">
        <h2>12. Updates to This Agreement</h2>
        <p>We may update this agreement over time to improve performance, enhance security, or add features. Material changes will be posted with an updated date.</p>
      </section>

      <section className="legal-section">
        <h2>13. Service Limits</h2>
        <p>The following limits apply to content uploaded to a Memory Charm:</p>
        <ul>
          <li><strong>Video:</strong> Up to 200 MB per charm. We recommend 30 seconds or less for the best viewing experience.</li>
          <li><strong>Images:</strong> Up to 10 photos per charm, with a combined size of up to 40 MB.</li>
          <li><strong>Audio:</strong> Up to 60 seconds recommended. Files should not exceed 50 MB.</li>
        </ul>
        <p>These limits reflect current platform capabilities and may be adjusted over time. Limits for your specific Charm Plan are disclosed at activation. We will not retroactively reduce limits for already-activated charms during their Hosting Commitment Period without reasonable notice.</p>
      </section>

      <section className="legal-section">
        <h2>14. Unactivated Accounts</h2>
        <p>The expiry of a memory at the end of its Hosting Commitment Period is the designed lifecycle of the product and is addressed in Section 4 above.</p>
        <p>Separately, accounts that were created but never used to activate any charm may be removed after twenty-four (24) months of inactivity. No content will be lost in these cases as no memory was ever bound.</p>
      </section>

      <section className="legal-section">
        <h2>15. Business Continuity — Acquisition &amp; Shutdown</h2>
        <p>We intend to operate Memory Charm for the long term. In the event of a significant business change, the following commitments apply.</p>
        <h3>Acquisition or Transfer</h3>
        <p>Any successor entity that acquires Memory Charm or its assets agrees, as a condition of that acquisition, to honour the Hosting Commitment Periods of all active charms at the time of transfer. Your memories will not be deleted as a result of a change in ownership.</p>
        <h3>Service Discontinuation</h3>
        <p>If we determine that the platform must be permanently discontinued, we will:</p>
        <ol>
          <li>Provide no less than ninety (90) days advance written notice to all registered users at their email address on file.</li>
          <li>Offer a sixty (60) day window during which you can download or export your uploaded content via your account.</li>
          <li>Permanently delete all hosted content after this window closes.</li>
        </ol>
        <p>We recommend maintaining your own copies of all uploaded media at all times.</p>
      </section>

      <section className="legal-section">
        <h2>16. Copyright &amp; DMCA Compliance</h2>
        <p>Memory Charm respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA), 17 U.S.C. § 512.</p>
        <p>If you believe content hosted on Memory Charm infringes your copyright, send a written notice to our Designated DMCA Agent at <a className="legal-link" href="mailto:dmca@memorycharm.com">dmca@memorycharm.com</a> that includes:</p>
        <ol>
          <li>Your physical or electronic signature.</li>
          <li>Identification of the copyrighted work claimed to be infringed.</li>
          <li>Identification of the infringing material and its location on our platform.</li>
          <li>Your contact information (name, address, phone, email).</li>
          <li>A statement that you have a good faith belief the use is not authorised.</li>
          <li>A statement under penalty of perjury that the information is accurate and that you are the copyright owner or authorised to act on their behalf.</li>
        </ol>
        <p>If you believe content was removed in error, you may submit a counter-notice to our Designated Agent. We will terminate accounts of users found to be repeat infringers.</p>
      </section>

      <section className="legal-section">
        <h2>17. Governing Law</h2>
        <p>This agreement is governed by the laws of the State of Minnesota, without regard to conflict of law principles.</p>
      </section>

      <section className="legal-section">
        <h2>18. A Final Word</h2>
        <p>Memory Charm exists to preserve moments — not to create legal battles.</p>
        <p>We promise to safeguard your memories, respect your privacy, and operate responsibly.</p>
        <p>You promise to use the platform responsibly, upload only content you have rights to, and keep your own backups.</p>
        <p>If you have questions, contact: <a className="legal-link" href="mailto:support@memorycharm.com">support@memorycharm.com</a></p>
      </section>
    </article>
  );
}
