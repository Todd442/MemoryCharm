import React, { useMemo, useState } from "react";
import { selectRandomGlyphs, type GlyphInfo } from "../app/data/glyphs";

export function GlyphAuthPanel(props: {
  attemptsLeft: number;
  busy: boolean;
  onSubmit: (glyphId: string) => void | Promise<void>;
}) {
  const glyphs = useMemo<GlyphInfo[]>(() => selectRandomGlyphs(9), []);
  const [selected, setSelected] = useState<string | null>(null);

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
        {glyphs.map((g) => {
          const selectedStyle =
            selected === g.id
              ? { outline: "3px solid rgba(80,80,80,0.55)", background: "rgba(180,180,180,0.35)" }
              : {};
          return (
            <button
              key={g.id}
              disabled={props.busy}
              onClick={() => setSelected(g.id)}
              style={{
                height: 64,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.25)",
                background: "rgba(230,230,230,0.6)",
                fontSize: 14,
                cursor: props.busy ? "default" : "pointer",
                ...selectedStyle,
              }}
            >
              {g.name}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 14 }}>
        <button
          disabled={props.busy || !selected}
          onClick={() => selected && props.onSubmit(selected)}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.25)",
            background: props.busy ? "rgba(120,120,120,0.25)" : "rgba(60,60,60,0.85)",
            color: "white",
            cursor: props.busy ? "default" : "pointer",
          }}
        >
          {props.busy ? "Verifying\u2026" : "Invoke"}
        </button>
      </div>
    </div>
  );
}
