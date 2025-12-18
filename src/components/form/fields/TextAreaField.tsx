interface TextAreaFieldProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  rows?: number;
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
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
    </div>
  );
}
