import { FieldHint } from "../../ui";

interface TextAreaFieldProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
}: TextAreaFieldProps) {
  const id = `textarea-field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="row">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={placeholder}
        rows={rows}
      />
      {hint && <FieldHint hint={hint} />}
    </div>
  );
}
