import React from "react";

export function ScrollTestPage() {
  const sections = Array.from({ length: 8 }).map((_, i) => i + 1);

  return (
    <div>
      <div className="te-h1">Scroll Test</div>

      <div className="te-card" style={{ marginBottom: 18 }}>
        <div className="te-muted">
          Goal: only the <strong>middle panel</strong> scrolls. The top plaque and bottom plate should stay fixed.
          <br />
          Also test: smooth touch scrolling, scroll chaining, and keyboard focus behavior.
        </div>
      </div>

      <Divider />

      {sections.map((n) => (
        <div key={n} style={{ marginBottom: 22 }}>
          <div className="te-h2">Section {n}</div>

          <div className="te-card">
            {Array.from({ length: 6 }).map((_, j) => (
              <p key={j} style={{ margin: "0 0 12px 0" }}>
                This is paragraph <strong>{j + 1}</strong> inside section <strong>{n}</strong>. Scroll should feel smooth
                on mobile and never move the frame.
              </p>
            ))}

            <label style={{ display: "block", marginTop: 14 }}>
              <div className="te-muted" style={{ marginBottom: 8 }}>
                Test input (keyboard + focus scroll)
              </div>
              <input
                className="te-input"
                placeholder="Tap me near the bottom"
                inputMode="text"
                autoComplete="off"
              />
            </label>
          </div>

          {n !== sections[sections.length - 1] && <Divider />}
        </div>
      ))}

      <div className="te-card" style={{ marginTop: 14 }}>
        <div className="te-h3">End of content</div>
        <div className="te-muted">
          If you can reach this, your scroll container is working. Now test “hard scrolling” at the top/bottom for bounce
          and scroll chaining.
        </div>
      </div>

      {/* little spacer so the last card isn't jammed against the bottom plate */}
      <div style={{ height: 28 }} />
    </div>
  );
}

function Divider() {
  return (
    <div style={{ margin: "18px 0" }}>
      {/* If you don't have the divider in /assets yet, comment this out */}
      <img
        src="/assets/divider.png"
        alt=""
        style={{ width: "100%", display: "block", opacity: 0.9 }}
        draggable={false}
      />
    </div>
  );
}
