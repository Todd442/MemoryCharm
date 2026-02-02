import React, { useState } from "react";

export function GlyphAuthPanel(props: {
  attemptsLeft: number;
  busy: boolean;
  onSubmit: (glyph: string) => void | Promise<void>;
}) {
  const [glyph, setGlyph] = useState("");

  return (
    <div>
      <h2 className="te-title">Prove your Mark</h2>
      <p className="te-body">
        Select the proper glyph to awaken the memory.
        <br />
        Attempts left: {props.attemptsLeft}
      </p>

      {/* Replace this with your real glyph grid/selector */}
      <div className="te-actions">
        <input
          className="te-input"
          value={glyph}
          onChange={(e) => setGlyph(e.target.value)}
          placeholder="glyph id / pattern"
          disabled={props.busy}
        />
        <button
          className="te-btn te-btn-primary"
          disabled={props.busy || !glyph.trim()}
          onClick={() => props.onSubmit(glyph.trim())}
        >
          {props.busy ? "Verifying…" : "Invoke"}
        </button>
      </div>
    </div>
  );
}
