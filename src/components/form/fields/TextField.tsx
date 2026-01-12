import { FieldHint } from "../../ui";

interface TextFieldProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}

export function TextField({ label, value, onChange, placeholder, required, hint }: TextFieldProps) {
  const id = `text-field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="row">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={placeholder}
        required={required}
      />
      {hint && <FieldHint hint={hint} />}
    </div>
  );
}
