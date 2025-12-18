interface SelectFieldProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  options: Array<{ value: string; label: string }>;
  emptyOption?: boolean;
  required?: boolean;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  emptyOption = true,
  required,
}: SelectFieldProps) {
  const id = `select-field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="row">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        required={required}
      >
        {emptyOption && <option value="">-</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
