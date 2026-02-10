import React, { useMemo } from "react";
import { selectRandomGlyphs, type GlyphInfo } from "../app/data/glyphs";

export function GlyphAuthPanel(props: {
  attemptsLeft: number;
  busy: boolean;
  onSubmit: (glyphId: string) => void | Promise<void>;
  glyphs?: { id: string; name: string }[];
}) {
  const glyphs = useMemo<GlyphInfo[]>(
    () => props.glyphs ?? selectRandomGlyphs(9),
    [props.glyphs]
  );

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 20, marginBottom: 8 }}>Glyph Required</div>
      <div style={{ marginBottom: 12 }}>
        Attempts left: <strong>{props.attemptsLeft}</strong>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(64px, 1fr))",
          gap: 10,
          maxWidth: 320,
        }}
      >
        {glyphs.map((g) => (
          <button
            key={g.id}
            disabled={props.busy}
            onClick={() => props.onSubmit(g.id)}
            style={{
              height: 64,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.25)",
              background: "rgba(230,230,230,0.6)",
              fontSize: 14,
              cursor: props.busy ? "default" : "pointer",
            }}
          >
            {g.name}
          </button>
        ))}
      </div>

      {props.busy && (
        <div style={{ marginTop: 14, fontSize: 14, opacity: 0.7 }}>Verifying…</div>
      )}
    </div>
  );
}
