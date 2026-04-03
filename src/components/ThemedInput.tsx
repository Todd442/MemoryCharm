import React from "react";
import textInputBg from "../assets/textInput-background.png";
import "./ThemedInput.css";

interface ThemedInputProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string;
  readOnly?: boolean;
  type?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
}

export function ThemedInput({ label, value, onChange, disabled, placeholder, hint, error, readOnly, type, inputMode }: ThemedInputProps) {
  return (
    <div className={`teField${readOnly ? " teField--readOnly" : ""}`}>
      <div className="teFieldLabel">{label}</div>
      <div className="teField--bgWrap" style={{ backgroundImage: `url(${textInputBg})` }}>
        {readOnly ? (
          <div className="teFieldValue">{value || "\u2014"}</div>
        ) : (
          <input
            className={`teFieldInput${error ? " teFieldInput--error" : ""}`}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            type={type}
            inputMode={inputMode}
          />
        )}
      </div>
      {error  && <div className="teFieldError">{error}</div>}
      {!error && hint && <div className="teFieldHint">{hint}</div>}
    </div>
  );
}
