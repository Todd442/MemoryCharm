import textInputBg from "../assets/textInput-background.png";
import "./ThemedInput.css";

interface ThemedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
}

export function ThemedInput({ label, value, onChange, disabled, placeholder, hint }: ThemedInputProps) {
  return (
    <label className="teField">
      <div className="teFieldLabel">{label}</div>
      <div className="teField--bgWrap" style={{ backgroundImage: `url(${textInputBg})` }}>
        <input
          className="teFieldInput"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
        />
      </div>
      {hint && <div className="teFieldHint">{hint}</div>}
    </label>
  );
}
