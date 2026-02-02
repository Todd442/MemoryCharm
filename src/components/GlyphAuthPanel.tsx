import React, { useMemo, useState } from "react";

export function GlyphAuthPanel(props: {
  attemptsLeft: number;
  busy: boolean;
  onSubmit: (glyph: string) => void | Promise<void>;
}) {
  const glyphIds = useMemo(() => ["1", "2", "3", "4", "5", "6", "7", "8", "9"], []);
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
        {glyphIds.map((id) => {
          const selectedStyle =
            selected === id
              ? { outline: "3px solid rgba(80,80,80,0.55)", background: "rgba(180,180,180,0.35)" }
              : {};
          return (
            <button
              key={id}
              disabled={props.busy}
              onClick={() => setSelected(id)}
              style={{
                height: 64,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.25)",
                background: "rgba(230,230,230,0.6)",
                fontSize: 22,
                cursor: props.busy ? "default" : "pointer",
                ...selectedStyle,
              }}
            >
              {id}
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
          {props.busy ? "Verifying…" : "Invoke"}
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
        (Mock: choose <strong>7</strong> for success)
      </div>
    </div>
  );
}
