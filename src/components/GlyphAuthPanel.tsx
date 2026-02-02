import React, { useMemo, useState } from "react";

export function GlyphAuthPanel(props: {
  attemptsLeft: number;
  busy: boolean;
  onSubmit: (glyph: string) => void | Promise<void>;
}) {
  const glyphIds = useMemo(() => ["1","2","3","4","5","6","7","8","9"], []);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <h2 className="te-title">Prove your Mark</h2>
      <p className="te-body">
        Choose the proper glyph to awaken the memory.<br/>
        Attempts left: {props.attemptsLeft}
      </p>

      <div className="te-glyph-grid">
        {glyphIds.map(id => (
          <button
            key={id}
            className={"te-glyph " + (selected === id ? "te-glyph-selected" : "")}
            disabled={props.busy}
            onClick={() => setSelected(id)}
          >
            {id}
          </button>
        ))}
      </div>

      <div className="te-actions" style={{ marginTop: 14 }}>
        <button
          className="te-btn te-btn-primary"
          disabled={props.busy || !selected}
          onClick={() => selected && props.onSubmit(selected)}
        >
          {props.busy ? "Verifying…" : "Invoke"}
        </button>
      </div>
    </div>
  );

  
}


