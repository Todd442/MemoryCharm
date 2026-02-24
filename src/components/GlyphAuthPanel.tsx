import { useMemo } from "react";
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
      <div
        style={{
          fontSize: "var(--fs-heading)",
          letterSpacing: 2,
          textTransform: "uppercase" as const,
          marginBottom: 8,
        }}
      >
        Glyph Required
      </div>
      <div style={{ marginBottom: 16, fontSize: "var(--fs-label)", opacity: 0.85 }}>
        Attempts left: <strong>{props.attemptsLeft}</strong>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
        }}
      >
        {glyphs.map((g) => (
          <button
            key={g.id}
            className="tePill"
            disabled={props.busy}
            onClick={() => props.onSubmit(g.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 10,
              cursor: props.busy ? "default" : "pointer",
            }}
          >
            {g.image ? (
              <img
                src={g.image}
                alt="Glyph"
                style={{ maxWidth: "100%", maxHeight: 140, objectFit: "contain" }}
                draggable={false}
              />
            ) : (
              <span style={{ fontSize: "var(--fs-label)" }}>{g.name}</span>
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
