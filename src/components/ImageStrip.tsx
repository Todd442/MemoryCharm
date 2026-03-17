import { useEffect, useRef, useState } from "react";
import "./ImageStrip.css";

// Editable mode — shows existing server photos + newly staged files in one grid
interface EditableProps {
  readOnly?: false;
  // Newly staged local files
  files: File[];
  onRemoveFile: (index: number) => void;
  onAdd: (picked: File[]) => void;
  max: number;
  disabled?: boolean;
  accept?: string;
  error?: string | null;
  // Existing server-side photos shown at the front of the grid
  serverUrls?: string[];
  onRemoveServer?: (index: number) => void;
}

// Read-only mode — settled/expired charms, no controls
interface ReadOnlyProps {
  readOnly: true;
  urls: string[];
}

type ImageStripProps = EditableProps | ReadOnlyProps;

export function ImageStrip(props: ImageStripProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [objectUrls, setObjectUrls] = useState<string[]>([]);

  const isReadOnly = props.readOnly === true;
  const files = isReadOnly ? [] : (props as EditableProps).files;

  useEffect(() => {
    if (isReadOnly) return;
    const created = files.map(f => URL.createObjectURL(f));
    setObjectUrls(created);
    return () => { created.forEach(u => URL.revokeObjectURL(u)); };
  }, [isReadOnly, files]);

  // ── Read-only (settled / expired) ──────────────────────────────────────────
  if (isReadOnly) {
    const { urls } = props as ReadOnlyProps;
    return (
      <div className="isWrap">
        <div className="isStrip">
          {urls.map((url, i) => (
            <div key={i} className="isThumb">
              <img src={url} alt={`Photo ${i + 1}`} className="isThumbImg" />
            </div>
          ))}
        </div>
        <div className="isFooter">
          <span className="isCount">{urls.length} photo{urls.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    );
  }

  // ── Editable ───────────────────────────────────────────────────────────────
  const {
    onRemoveFile, onAdd, max, disabled, accept, error,
    serverUrls = [], onRemoveServer,
  } = props as EditableProps;

  const totalCount = serverUrls.length + files.length;

  return (
    <div className="isWrap">
      <div className="isStrip">
        {/* Existing server photos */}
        {serverUrls.map((url, i) => (
          <div key={`s-${i}`} className="isThumb">
            <img src={url} alt={`Photo ${i + 1}`} className="isThumbImg" />
            {onRemoveServer && (
              <button
                className="isThumbRemove"
                onClick={() => onRemoveServer(i)}
                disabled={disabled}
                type="button"
                aria-label={`Remove photo ${i + 1}`}
              >
                &#x2715;
              </button>
            )}
          </div>
        ))}

        {/* Newly staged local files */}
        {files.map((file, i) => (
          <div key={`${file.name}-${file.lastModified}-${i}`} className="isThumb">
            {objectUrls[i] && (
              <img src={objectUrls[i]} alt={file.name} className="isThumbImg" />
            )}
            <button
              className="isThumbRemove"
              onClick={() => onRemoveFile(i)}
              disabled={disabled}
              type="button"
              aria-label={`Remove ${file.name}`}
            >
              &#x2715;
            </button>
          </div>
        ))}

        {/* Add tile */}
        {totalCount < max && (
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
