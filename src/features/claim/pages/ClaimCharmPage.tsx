import React from "react";
import { useParams } from "react-router-dom";

export function ClaimCharmPage() {
  const { code } = useParams<{ code: string }>();

  return (
    <div>
      <h2 className="te-title">Claim this Charm</h2>
      <p className="te-body">
        This charm hasn’t been bound to a keeper yet.
      </p>

      <div className="te-card">
        <div className="te-body">
          <div><strong>Charm Code:</strong> {code}</div>
        </div>
      </div>

      <div className="te-actions">
        <button className="te-btn">Log in</button>
        <button className="te-btn te-btn-primary">Create account</button>
      </div>

      <p className="te-footnote">
        After signing in, you’ll choose your memory type and upload your media.
      </p>
    </div>
  );
}
