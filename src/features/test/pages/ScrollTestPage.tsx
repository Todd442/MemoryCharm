import React from "react";

export function ScrollTestPage() {
  return (
    <div>
      <h1 style={{ margin: "0 0 12px 0", fontSize: 40 }}>Scroll Test</h1>
      <p style={{ margin: "0 0 18px 0", opacity: 0.9 }}>
        Goal: only the middle panel scrolls. Top plaque and bottom plate should stay fixed.
      </p>

      <img src="/assets/divider.png" alt="" style={{ width: "100%", margin: "18px 0" }} />

      {/* Big blocks */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>Section {i + 1}</div>
          <div style={{ opacity: 0.9 }}>
            {Array.from({ length: 6 }).map((__, j) => (
              <p key={j} style={{ margin: "0 0 10px 0" }}>
                This is paragraph {j + 1} inside section {i + 1}. Scroll should feel smooth on mobile.
              </p>
            ))}
          </div>

          {/* Inputs to test keyboard + focus scroll */}
          <label style={{ display: "block", marginTop: 10 }}>
            <div style={{ fontSize: 16, opacity: 0.75, marginBottom: 6 }}>Test input (keyboard)</div>
            <input
              placeholder="Tap me near the bottom"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.35)",
                color: "inherit",
              }}
            />
          </label>
        </div>
      ))}

      <div style={{ height: 80 }} />
      <div style={{ opacity: 0.8 }}>End of content.</div>
    </div>
  );
}
