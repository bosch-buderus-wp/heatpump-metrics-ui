interface NumberFieldProps {
  label: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number | string;
  placeholder?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
}: NumberFieldProps) {
  const id = `number-field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="row">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        step={step}
        min={min}
        max={max}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        placeholder={placeholder}
      />
    </div>
  );
}
