import { useEffect, useRef, useState } from "react";
import "./ImageStrip.css";

interface ImageStripProps {
  files: File[];
  onRemove: (index: number) => void;
  onAdd: (picked: File[]) => void;
  max: number;
  disabled?: boolean;
  accept?: string;
  error?: string | null;
}

export function ImageStrip({ files, onRemove, onAdd, max, disabled, accept, error }: ImageStripProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const created = files.map(f => URL.createObjectURL(f));
    setUrls(created);
    return () => { created.forEach(u => URL.revokeObjectURL(u)); };
  }, [files]);

  return (
    <div className="isWrap">
      <div className="isStrip">
        {files.map((file, i) => (
          <div key={`${file.name}-${file.lastModified}-${i}`} className="isThumb">
            {urls[i] && (
              <img src={urls[i]} alt={file.name} className="isThumbImg" />
            )}
            <button
              className="isThumbRemove"
              onClick={() => onRemove(i)}
              disabled={disabled}
              type="button"
              aria-label={`Remove ${file.name}`}
            >
              &#x2715;
            </button>
          </div>
        ))}

        {files.length < max && (
          <button
            className="isThumbAdd"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            type="button"
            aria-label="Add more photos"
          >
            +
          </button>
        )}
      </div>

      <div className="isFooter">
        <span className="isCount">{files.length} of {max} photos</span>
        {files.length < max && (
          <button
            className="isAddLink"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            type="button"
          >
            Add more photos
          </button>
        )}
      </div>

      {error && <div className="isError">{error}</div>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAdd(Array.from(e.target.files));
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}