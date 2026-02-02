import React from "react";
import { useParams, Link } from "react-router-dom";

export function ClaimCharmPage() {
  const { code } = useParams<{ code: string }>();

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 24 }}>Claim this Charm</div>
      <p style={{ marginTop: 12 }}>
        This charm hasn’t been registered yet.
      </p>

      <div style={{ marginTop: 12 }}>
        <strong>Charm Code:</strong> {code}
      </div>

      <div style={{ marginTop: 18 }}>
        <button style={{ padding: "10px 14px", marginRight: 10 }}>Log in</button>
        <button style={{ padding: "10px 14px" }}>Create account</button>
      </div>

      <p style={{ marginTop: 18 }}>
        <Link to="/">Back to Home</Link>
      </p>
    </div>
  );
}
