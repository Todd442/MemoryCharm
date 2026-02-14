import React, { useMemo } from "react";
import { selectRandomGlyphs, glyphById, type GlyphInfo } from "../app/data/glyphs";

export function GlyphAuthPanel(props: {
  attemptsLeft: number;
  busy: boolean;
  onSubmit: (glyphId: string) => void | Promise<void>;
  glyphs?: { id: string; name: string }[];
}) {
  const glyphs = useMemo<GlyphInfo[]>(() => {
    if (!props.glyphs) return selectRandomGlyphs(9);
    return props.glyphs.map((g) => glyphById(g.id) ?? { ...g, image: "" });
  }, [props.glyphs]);

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: "var(--fs-heading)", marginBottom: 8 }}>Glyph Required</div>
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
              height: 100,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.25)",
              background: "rgba(230,230,230,0.6)",
              cursor: props.busy ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 6,
            }}
          >
            {g.image ? (
              <img
                src={g.image}
                alt="Glyph"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                draggable={false}
              />
            ) : (
              <span style={{ fontSize: "var(--fs-small)" }}>{g.name}</span>
            )}
          </button>
        ))}
      </div>

      {props.busy && (
        <div style={{ marginTop: 14, fontSize: "var(--fs-small)", opacity: 0.7 }}>Verifying…</div>
      )}
    </div>
  );
}
