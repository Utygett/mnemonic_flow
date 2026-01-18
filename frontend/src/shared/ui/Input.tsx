import React from 'react';

type InputType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'search'
  | 'tel'
  | 'url';

interface InputProps {
  value: string;
  onChange: (value: string) => void;

  type?: InputType;          // <-- добавили
  placeholder?: string;
  label?: string;

  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
}

export function Input({
  value,
  onChange,
  type = 'text',             // <-- дефолт
  placeholder,
  label,
  multiline = false,
  rows = 3,
  disabled = false,
}: InputProps) {
  return (
    <div className="form-row">
      {label && <label className="form-label">{label}</label>}

      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="input input--textarea"
        />
      ) : (
        <input
          type={type}          // <-- пробросили сюда
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="input"
        />
      )}
    </div>
  );
}
