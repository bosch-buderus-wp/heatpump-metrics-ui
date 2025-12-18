interface TextFieldProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  required?: boolean;
}

export function TextField({ label, value, onChange, placeholder, required }: TextFieldProps) {
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
    </div>
  );
}
