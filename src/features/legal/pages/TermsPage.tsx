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
          <p className="legal-updated">Last Updated: March 15, 2026</p>
          <p className="legal-lead">
            These Terms and Conditions ("Terms") govern your purchase, activation, and use of the
            Memory Charm physical product and associated digital services (collectively, the
            "Services") provided by Triangles End LLC ("Company," "we," "us," or "our").
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
          <h3>2.3 Unactivated Accounts</h3>
          <p>
            The expiry of a memory at the end of its Hosting Commitment Period is the designed lifecycle of the product and is addressed in Section 7. Separately, accounts that were created but never used to activate any charm may be removed after twenty-four (24) months of inactivity. No content is lost in these cases because no memory was ever bound to the account.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. License Grant</h2>
          <h3>3.1 Limited License to Use the Platform</h3>
          <p>
            The Company grants you a limited, non-exclusive, non-transferable, revocable license to
            access and use the Memory Charm platform solely for personal, non-commercial purposes.
          </p>
          <p>You may:</p>
          <ul>
            <li>Upload your own content</li>
            <li>Share your charm with friends and family</li>
            <li>Gift the physical charm to another person; the recipient acquires the license upon activation or continued use</li>
          </ul>
          <p>You may not:</p>
          <ul>
            <li>Reverse engineer, decompile, or disassemble any part of the platform software</li>
            <li>Resell, sublicense, or provide commercial third-party access to the hosting service</li>
            <li>Use the platform for commercial purposes without written authorisation from the Company</li>
            <li>Attempt to bypass, circumvent, or disable any service limits, access controls, rate limits, or security measures</li>
          </ul>
          <h3>3.2 No Transfer of Platform Ownership</h3>
          <p>
            You are not purchasing ownership of the software platform, hosting infrastructure, or any
            intellectual property of the Company. These Terms grant only the limited license described above.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Age Restrictions</h2>
          <h3>4.1 Minimum Age to Register and Upload</h3>
          <p>
            You must be at least 18 years of age to create an account, activate a Memory Charm, or
            upload, manage, or associate content with the Services. By creating an account or
            uploading content, you represent and warrant that you are at least 18 years old.
          </p>
          <h3>4.2 Children Under 13</h3>
          <p>
            The Services are not directed at children under the age of 13. The Company does not
            knowingly collect personal information from children under 13. If you believe that a
            child under 13 has provided personal information through the Services, please contact
            us and we will take steps to delete such information.
          </p>
          <h3>4.3 Viewer Responsibility</h3>
          <p>
            The account holder is responsible for ensuring that access to their Memory Charm is
            appropriate for any viewer who may access it, including minors. The Company assumes no
            responsibility for the suitability of user-uploaded content for any particular audience.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Content Ownership and License</h2>
          <h3>5.1 You Retain Ownership</h3>
          <p>
            You retain full copyright and all other ownership rights in any content you upload or
            associate with a Memory Charm ("Your Content"). These Terms do not transfer any
            ownership of Your Content to the Company.
          </p>
          <h3>5.2 License You Grant to the Company</h3>
          <p>
            By uploading Your Content, you grant the Company a limited, non-exclusive,
            royalty-free, worldwide license to host, store, reproduce, transmit, display, and
            deliver Your Content solely as necessary to operate and provide the Services to you and
            authorised viewers. This license exists for no purpose other than enabling the Company
            to operate the Services.
          </p>
          <h3>5.3 No Promotional Use</h3>
          <p>
            The Company will not use Your Content in advertising, marketing materials, social
            media, or any other promotional context without your explicit, written consent obtained
            separately from these Terms.
          </p>
          <h3>5.4 License Termination</h3>
          <p>
            The license described in Section 5.2 terminates when Your Content is permanently
            deleted from the Services. Deletion may occur upon your request, upon expiration of
            your Hosting Commitment Period, or upon removal of violating content under these Terms.
            Residual copies in backup systems may persist briefly after deletion but will not be
            used or made accessible.
          </p>
          <h3>5.5 Your Representations</h3>
          <p>By uploading or associating content with a Memory Charm, you represent and warrant that:</p>
          <ul>
            <li>You have all rights necessary to upload, display, and grant the license above.</li>
            <li>The content does not infringe any intellectual property, privacy, or publicity rights of any third party.</li>
            <li>The content complies with all applicable laws.</li>
            <li>You have obtained all necessary consents from any identifiable individuals appearing in the content.</li>
          </ul>
          <p>You are solely responsible for Your Content.</p>
        </section>

        <section className="legal-section">
          <h2>6. Charm Plans and Hosting Commitment Period</h2>
          <h3>6.1 Charm Plans</h3>
          <p>Memory Charm products are offered under different service tiers ("Charm Plans"). Each Charm Plan may include:</p>
          <ul>
            <li>A defined hosting duration ("Hosting Commitment Period")</li>
            <li>Applicable storage limits</li>
            <li>Feature availability</li>
            <li>Optional viewing controls</li>
            <li>Any additional services</li>
          </ul>
          <p>The specific Charm Plan and its details ("Plan Details") are disclosed at or before activation and may appear on packaging, product listings, or within the activation interface.</p>
          <h3>6.2 Activation Date</h3>
          <p>The Hosting Commitment Period begins on the date the Memory Charm is first activated ("Activation Date"), not the purchase date.</p>
          <h3>6.3 Plan Stability</h3>
          <p>The Plan Details presented at activation control in the event of any conflict with marketing or third-party descriptions. The Company may make changes required for security, legal compliance, infrastructure sustainability, or platform integrity.</p>
        </section>

        <section className="legal-section">
          <h2>7. Hosting Commitment</h2>
          <h3>7.1 Service Commitment</h3>
          <p>
            During the applicable Hosting Commitment Period, the Company will use commercially
            reasonable efforts to provide access to hosted content associated with the activated
            Memory Charm. Uninterrupted, error-free, or permanent availability is not guaranteed.
          </p>
          <p>
            At the end of the Hosting Commitment Period, hosted content will expire and may no
            longer be accessible. This is the intended lifecycle of the product, not a failure of
            service. The Company may offer renewal options to extend the period before it expires.
          </p>
          <h3>7.2 Permitted Modifications</h3>
          <p>The Company may modify, update, replace, or migrate hosting providers, storage infrastructure, file formats, delivery methods, URLs, security systems, and user interfaces to maintain viability, compliance, security, performance, or sustainability. The Company is not required to maintain any specific feature, interface, or technology.</p>
        </section>

        <section className="legal-section">
          <h2>8. Business Continuity</h2>
          <h3>8.1 Acquisition or Transfer</h3>
          <p>
            If the Company is acquired or transfers its assets to a successor entity, the successor
            agrees, as a condition of that transfer, to honour the Hosting Commitment Periods of all
            active charms at the time of transfer. Your memories will not be deleted as a result of
            a change in ownership.
          </p>
          <h3>8.2 Service Discontinuation</h3>
          <p>If the Company determines that the Services must be permanently discontinued, the Company will:</p>
          <ol>
            <li>Provide no less than ninety (90) days advance written notice to all registered users at their email address on file.</li>
            <li>Offer a sixty (60) day window during which users may download or export their uploaded content via their account.</li>
            <li>Permanently delete all hosted content after the export window closes.</li>
          </ol>
          <p>
            The Company cannot guarantee that content exported during this window will be playable
            outside the Memory Charm platform, as playback depends on the Company's application.
            Users are encouraged to maintain independent copies of all uploaded media at all times.
          </p>
          <h3>8.3 Reserve Right to Discontinue</h3>
          <p>
            The Company reserves the right to discontinue the Services if the platform becomes
            technically or economically unviable, or if laws or regulations require material changes
            that make continued operation impracticable, subject to the notice obligations in
            Section 8.2.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Content Modification Window and Freeze</h2>
          <h3>9.1 Fourteen-Day Modification Window</h3>
          <p>Following Activation, users may upload, replace, or modify media content for fourteen (14) calendar days ("Modification Window"). After expiration, media content becomes fixed and may not be replaced, edited, or altered through standard use of the Services. The inability to modify media content after expiration shall not constitute a defect, service failure, or breach of these Terms.</p>
          <h3>9.2 Metadata Updates</h3>
          <p>After expiration of the Modification Window, users may update non-media descriptive elements such as memory title, text description, and display captions.</p>
          <h3>9.3 Optional Reopening</h3>
          <p>The Company may, at its sole discretion, offer paid services that temporarily reopen the Modification Window. Such services are not guaranteed, may vary by Charm Plan, may be discontinued at any time, and are subject to additional terms. Nothing in these Terms creates a right to reopen media after expiration of the Modification Window.</p>
          <h3>9.4 User Responsibility</h3>
          <p>Users are responsible for reviewing and confirming uploaded media during the Modification Window. After expiration, the Company is not responsible for incorrect uploads, unintended versions, formatting errors, or file selection mistakes.</p>
        </section>

        <section className="legal-section">
          <h2>10. Service Limits</h2>
          <h3>10.1 Current Content Limits</h3>
          <p>The following limits apply to content uploaded to a Memory Charm:</p>
          <ul>
            <li><strong>Video:</strong> Up to 200 MB per charm. 30 seconds or less is recommended for the best viewing experience.</li>
            <li><strong>Images:</strong> Up to 10 photos per charm, with a combined size of up to 40 MB.</li>
            <li><strong>Audio:</strong> Up to 60 seconds recommended. Files should not exceed 50 MB.</li>
          </ul>
          <p>These limits reflect current platform capabilities and may vary by Charm Plan. Limits applicable to your specific Charm Plan are disclosed at activation.</p>
          <h3>10.2 No Retroactive Reduction</h3>
          <p>The Company will not retroactively reduce the content limits applicable to an already-activated charm during its Hosting Commitment Period without reasonable prior notice.</p>
        </section>

        <section className="legal-section">
          <h2>11. Access Method and Viewing Controls</h2>
          <h3>11.1 Viewing Access</h3>
          <p>Memory Charm provides access to associated content through a web-based viewing experience triggered by the charm. Anyone with access to the charm or its viewing path may be able to view associated content unless optional viewing controls are enabled. The Company is not responsible for access resulting from intentional or unintentional sharing by the user or third parties.</p>
          <h3>11.2 Optional Glyph Control</h3>
          <p>Certain Charm Plans allow activation of a visual glyph confirmation step before content is displayed. The glyph is intended to introduce intentional access friction. It is not a password system, authentication mechanism, encryption system, or security guarantee.</p>
          <h3>11.3 Traffic and Abuse Controls</h3>
          <p>To protect system integrity and availability, the Company may implement rate limits, automated abuse detection, and other safeguards. These safeguards may temporarily restrict access in cases of excessive, automated, or suspicious traffic. Such restrictions do not constitute a defect or service failure. The Company does not guarantee prevention of unauthorised or automated access.</p>
        </section>

        <section className="legal-section">
          <h2>12. Sustainability Funding</h2>
          <p>The Company may allocate a portion of product revenue to support hosting and infrastructure during Hosting Commitment Periods. Any such allocation is an internal business practice and does not create a trust, escrow account, fiduciary obligation, or segregated fund for any individual customer.</p>
        </section>

        <section className="legal-section">
          <h2>13. Customer Backups</h2>
          <p>Users are responsible for maintaining independent backups of their media. The Services are not guaranteed to function as the sole archival repository of important data.</p>
        </section>

        <section className="legal-section">
          <h2>14. Transferability</h2>
          <p>
            Charm Plans follow the physical Memory Charm. If a charm is gifted, the recipient
            becomes the user of record upon activation. The original purchaser no longer retains
            administrative access rights unless explicitly shared.
          </p>
          <p>Anyone in possession of the charm may be able to access associated content unless optional viewing controls are enabled. The Company is not responsible for unauthorised access resulting from loss, theft, or transfer of the physical charm.</p>
        </section>

        <section className="legal-section">
          <h2>15. NFC and Device Compatibility</h2>
          <p>The Company does not guarantee compatibility with all devices, operating systems, browsers, or NFC implementations. Device updates or manufacturer changes may affect performance.</p>
        </section>

        <section className="legal-section">
          <h2>16. Prohibited Content</h2>
          <p>You may not upload, associate, or transmit content that:</p>
          <ul>
            <li><strong>Infringes intellectual property rights.</strong> Content you do not own or have licensed, including copyrighted images, videos, or music, without authorisation from the rights holder.</li>
            <li><strong>Is sexually explicit or pornographic.</strong> Nudity or sexual content of any kind is prohibited on the Services.</li>
            <li><strong>Depicts or exploits minors.</strong> Any content that sexualises, exploits, or endangers minors is strictly prohibited and will be reported to the National Center for Missing and Exploited Children (NCMEC) and law enforcement as required by applicable law.</li>
            <li><strong>Violates privacy or publicity rights.</strong> Non-consensual intimate images, doxxing, or content depicting identifiable individuals without their consent.</li>
            <li><strong>Is defamatory, threatening, or harassing.</strong> Content intended to harm, intimidate, or harass any individual or group.</li>
            <li><strong>Violates any applicable law.</strong> Content that is illegal in your jurisdiction or in the United States.</li>
            <li><strong>Contains malware or malicious code.</strong> Files, links, or content designed to damage, disrupt, or gain unauthorised access to systems.</li>
          </ul>
          <p>
            The Company reserves the right, but assumes no obligation, to review uploaded content.
            Violation of this section may result in immediate removal of content, account suspension,
            and referral to law enforcement where legally required.
          </p>
        </section>

        <section className="legal-section">
          <h2>17. Content Removal</h2>
          <h3>17.1 Company-Initiated Removal</h3>
          <p>
            The Company may remove or disable access to content at any time if it reasonably
            believes the content violates these Terms, applicable law, or the rights of any third
            party. The Company will use reasonable efforts to notify the account holder of removal,
            except where prohibited by law or where emergency action is required.
          </p>
          <h3>17.2 User-Requested Removal</h3>
          <p>
            You may request removal of Your Content by contacting the Company. Requests will be
            processed within a reasonable time. Note that deletion of content associated with an
            activated Memory Charm effectively renders the charm non-functional. Removal of content
            at your request does not entitle you to a refund of the purchase price or any portion
            of the Hosting Commitment Period.
          </p>
          <h3>17.3 Third-Party Removal Claims</h3>
          <p>
            If a third party credibly claims that content hosted on the Services belongs to them or
            infringes their rights, the Company may remove or disable access to that content while
            the claim is investigated. The Company is not liable for removal of content based on a
            third-party claim later found to be erroneous. Account holders disputing such removals
            should follow the counter-notice procedure described in Section 18.
          </p>
          <h3>17.4 No Guarantee of Availability After Removal Request</h3>
          <p>
            Removal of content is not instantaneous and may be subject to caching, CDN propagation
            delays, or other technical factors. The Company does not guarantee that removed content
            will be inaccessible to all parties at any specific time following a removal request.
          </p>
        </section>

        <section className="legal-section">
          <h2>18. DMCA Copyright Policy</h2>
          <h3>18.1 Designated Agent</h3>
          <p>
            The Company respects intellectual property rights and complies with the Digital
            Millennium Copyright Act ("DMCA"), 17 U.S.C. § 512. Copyright owners who believe that
            content hosted on the Services infringes their copyright may submit a written notice to
            the Company's designated DMCA agent:
          </p>
          <p>
            <strong>DMCA Agent:</strong> Triangles End LLC<br />
            <strong>Email:</strong> dmca@trianglesend.com<br />
            <strong>Subject line:</strong> DMCA Takedown Notice
          </p>
          <h3>18.2 Required Information for a Takedown Notice</h3>
          <p>A valid DMCA takedown notice must include:</p>
          <ul>
            <li>A physical or electronic signature of the copyright owner or authorised agent.</li>
            <li>Identification of the copyrighted work claimed to be infringed.</li>
            <li>Identification of the material on the Services that is claimed to be infringing, with sufficient information to locate it (e.g., the charm URL).</li>
            <li>Your contact information (name, address, telephone number, and email).</li>
            <li>A statement that you have a good faith belief that the use of the material is not authorised by the copyright owner, its agent, or the law.</li>
            <li>A statement, under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner or authorised to act on the owner's behalf.</li>
          </ul>
          <h3>18.3 Counter-Notice Procedure</h3>
          <p>
            If content you uploaded was removed in response to a DMCA notice and you believe the
            removal was made in error or based on misidentification, you may submit a counter-notice
            to the designated agent listed above. A valid counter-notice must include:
          </p>
          <ul>
            <li>Your physical or electronic signature.</li>
            <li>Identification of the material that was removed and the location where it appeared before removal.</li>
            <li>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake or misidentification.</li>
            <li>Your name, address, and telephone number.</li>
            <li>A statement that you consent to the jurisdiction of the Federal District Court for the judicial district in which your address is located, and that you will accept service of process from the party who submitted the original takedown notice.</li>
          </ul>
          <p>
            Upon receipt of a valid counter-notice, the Company may restore the removed content
            after the statutory waiting period unless the original claimant files a court action.
          </p>
          <h3>18.4 Repeat Infringers</h3>
          <p>
            The Company maintains a policy of terminating accounts of users who are repeat
            infringers of intellectual property rights in appropriate circumstances.
          </p>
        </section>

        <section className="legal-section">
          <h2>19. Privacy and Data Collection</h2>
          <p>
            The Company's collection, use, and protection of personal data is governed by our{" "}
            <a href="/privacy">Privacy Policy</a>, which is incorporated into these Terms by
            reference. By using the Services, you agree to the practices described in the Privacy
            Policy.
          </p>
          <p>The Company collects only information reasonably necessary to operate the Services. Uploaded content is processed solely to provide the Services and is not sold for advertising purposes.</p>
          <h3>19.1 Why We Collect Address and Phone Number</h3>
          <p>Account registration requires a mailing address and phone number. These are collected for the following specific purposes:</p>
          <ul>
            <li><strong>Ownership verification.</strong> Contact information is used to confirm identity when handling account disputes, support requests, or requests for account changes.</li>
            <li><strong>Copyright and legal contact.</strong> The Company may be required to contact users in connection with copyright complaints, DMCA notices, or other legal matters relating to uploaded content. Physical address and phone number are standard requirements under these processes.</li>
            <li><strong>Critical service notifications.</strong> The Company commits to notifying registered users before their Hosting Commitment Period expires and before any service discontinuation. While email is the primary notification channel, mailing address and phone number serve as backup contact methods for notices that materially affect a user's memories.</li>
            <li><strong>Warranty fulfilment.</strong> A mailing address is required to deliver a replacement charm where a manufacturing defect is covered under the applicable warranty.</li>
          </ul>
          <p>Address and phone number are not used for marketing. They will not be shared with third parties except as required by law or as necessary to fulfil the purposes stated above.</p>
        </section>

        <section className="legal-section">
          <h2>20. Security Expectations</h2>
          <h3>20.1 Measures the Company Takes</h3>
          <p>The Company implements industry-standard technical safeguards including:</p>
          <ul>
            <li>Encrypted transmission of content and account data using HTTPS/TLS.</li>
            <li>Access token authentication for account management functions.</li>
            <li>Rate limiting and abuse detection to prevent automated bulk access or enumeration of content.</li>
          </ul>
          <h3>20.2 What the Company Cannot Guarantee</h3>
          <p>
            No security system is impenetrable. The Company cannot guarantee that the Services are
            free from unauthorised access, data breaches, or cyberattacks. The Company is not
            liable for unauthorised access to content that results from factors beyond its
            reasonable control.
          </p>
          <h3>20.3 Content Is URL-Accessible by Design</h3>
          <p>
            Memory Charm content is accessible to anyone who obtains the viewing URL or physical
            charm, unless optional viewing controls (such as the glyph) are enabled. The URL
            associated with your charm is not a secret — it is encoded in the NFC tag and may be
            shared, forwarded, or discovered. Users who require restricted access should enable
            available viewing controls.
          </p>
          <h3>20.4 Physical Charm Security</h3>
          <p>
            You are responsible for the physical security of your Memory Charm. Anyone who gains
            access to the physical charm can tap it to access associated content. If your charm is
            lost or stolen, contact the Company to explore options for disabling associated content.
          </p>
          <h3>20.5 Breach Notification</h3>
          <p>
            In the event of a security breach that affects your personal data, the Company will
            notify affected users as required by applicable law.
          </p>
        </section>

        <section className="legal-section">
          <h2>21. Physical Product Warranty</h2>
          <h3>21.1 Limited Warranty Against Manufacturing Defects</h3>
          <p>
            The Company warrants that the physical Memory Charm hardware, including the NFC tag
            embedded in the product, is free from defects in materials and workmanship for ninety
            (90) days from the original purchase date ("Warranty Period"). If a Memory Charm fails
            due to a covered manufacturing defect during the Warranty Period, the Company will, at
            its option, repair or replace the defective charm at no charge.
          </p>
          <h3>21.2 What Is Not Covered</h3>
          <p>This warranty does not cover:</p>
          <ul>
            <li>Damage caused by accident, misuse, abuse, neglect, or modification.</li>
            <li>Damage caused by exposure to extreme temperature, moisture, or physical impact.</li>
            <li>Normal wear and tear.</li>
            <li>Damage resulting from failure to follow product instructions.</li>
            <li>Loss of the physical charm.</li>
          </ul>
          <h3>21.3 Device Failure and Your Content</h3>
          <p>
            A replacement charm will be linked to your existing account and associated content,
            provided that the Hosting Commitment Period has not expired and your account remains in
            good standing. Content is stored on Company-managed servers, not on the physical charm
            itself, so physical charm failure does not cause loss of hosted content.
          </p>
          <h3>21.4 How to Claim</h3>
          <p>
            To claim a warranty replacement, contact the Company with proof of purchase and a
            description of the defect. A valid mailing address is required for fulfilment of
            physical replacements.
          </p>
          <h3>21.5 Exclusive Remedy</h3>
          <p>
            Repair or replacement of the defective physical charm is the sole and exclusive remedy
            for a warranty claim. This warranty gives you specific legal rights; you may also have
            other rights that vary by jurisdiction.
          </p>
        </section>

        <section className="legal-section">
          <h2>22. Warranty Disclaimer (Digital Services)</h2>
          <p>To the maximum extent permitted by law, the digital Services (hosting, delivery, and access to content) are provided "as is" and "as available," without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement. The physical product warranty in Section 21 is the only express warranty provided by the Company.</p>
        </section>

        <section className="legal-section">
          <h2>23. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, the Company shall not be liable for indirect, incidental, consequential, special, exemplary, or punitive damages, including loss of data, loss of content, loss of sentimental value, emotional distress, or goodwill.</p>
          <p>The Company's total liability for any claim relating to a Memory Charm or the Services shall not exceed the amount paid for the specific Memory Charm giving rise to the claim.</p>
        </section>

        <section className="legal-section">
          <h2>24. Indemnification</h2>
          <p>You agree to indemnify and hold harmless the Company from claims arising from your content, your use of the Services, or your violation of these Terms, including any claim by a third party that your content infringes their intellectual property or privacy rights.</p>
        </section>

        <section className="legal-section">
          <h2>25. Force Majeure</h2>
          <p>The Company is not responsible for delays or failures caused by events beyond its reasonable control, including infrastructure failures, cloud provider outages, cyberattacks, regulatory changes, natural disasters, or other force majeure events.</p>
        </section>

        <section className="legal-section">
          <h2>26. Changes to Terms</h2>
          <p>The Company may update these Terms periodically. Continued use of the Services after updates constitutes acceptance of revised Terms.</p>
        </section>

        <section className="legal-section">
          <h2>27. Governing Law</h2>
          <p>These Terms are governed by the laws of the State of Minnesota, without regard to conflict-of-law principles.</p>
        </section>
      </article>
    </div>
  );
}
