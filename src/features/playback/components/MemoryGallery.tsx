import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { ContentFile } from "../types";
import "./MemoryGallery.css";

/**
 * 3D floating gallery — images orbit a central logo in the nebula.
 * Tap one to zoom it into a framed view. X button sends it back.
 */
export function MemoryGallery(props: { files: ContentFile[] }) {
  const { files } = props;
  const nav = useNavigate();
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = useCallback((i: number) => {
    setSelected(i);
  }, []);

  const handleDismiss = useCallback(() => {
    setSelected(null);
  }, []);

  const isOpen = selected !== null;

  return (
    <div className="mg-scene">
      {/* 3D space with logo + floating images */}
      <div className={`mg-space ${isOpen ? "mg-space--dimmed" : ""}`}>
        {/* Central brand anchor — tap to go home */}
        <button className="mg-logo" onClick={() => nav("/")}>
          <div className="mg-logo__text">Memory</div>
          <div className="mg-logo__sub">Charm</div>
        </button>

        {/* Floating image cards radiating from center */}
        {files.map((file, i) => (
          <button
            key={i}
            className={`mg-card mg-card--${Math.min(i, 9)}`}
            onClick={() => !isOpen && handleSelect(i)}
            tabIndex={isOpen ? -1 : 0}
            aria-label={`Memory ${i + 1} of ${files.length}`}
          >
            <img src={file.url} alt="" className="mg-card__img" draggable={false} />
          </button>
        ))}
      </div>

      {/* Zoomed-in framed view */}
      {isOpen && (
        <div className="mg-focus" onClick={handleDismiss}>
          <div className="mg-focus__frame" onClick={(e) => e.stopPropagation()}>
            <div className="pb-brand" onClick={() => nav("/")} style={{ cursor: "pointer" }}>Memory Charm</div>
            <img
              src={files[selected!].url}
              alt={`Memory ${selected! + 1} of ${files.length}`}
              className="pb-media"
            />
            <button
              className="mg-focus__close"
              onClick={handleDismiss}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
