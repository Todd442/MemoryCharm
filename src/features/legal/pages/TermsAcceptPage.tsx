import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { acceptTerms } from "../../../app/api/profileApi";
import { consumeUlaReturnTo } from "../../../app/auth/RequireUla";
import { UlaContent } from "../components/UlaContent";
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
        <span className="legal-nav__title">Memory Charm™</span>
      </nav>

      <UlaContent />

      <div className="ula-accept-footer">
        {error && <p className="ula-accept-error">{error}</p>}
        <p className="ula-accept-notice">
          By clicking Accept, you confirm you have read and agree to this User License Agreement.
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
