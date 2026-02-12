import textInputBg from "../assets/textInput-background.png";
import "./ThemedInput.css";

interface ThemedInputProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
  readOnly?: boolean;
}

export function ThemedInput({ label, value, onChange, disabled, placeholder, hint, readOnly }: ThemedInputProps) {
  return (
    <div className={`teField${readOnly ? " teField--readOnly" : ""}`}>
      <div className="teFieldLabel">{label}</div>
      <div className="teField--bgWrap" style={{ backgroundImage: `url(${textInputBg})` }}>
        {readOnly ? (
          <div className="teFieldValue">{value || "\u2014"}</div>
        ) : (
          <input
            className="teFieldInput"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
          />
        )}
      </div>
      {hint && <div className="teFieldHint">{hint}</div>}
    </div>
  );
}
