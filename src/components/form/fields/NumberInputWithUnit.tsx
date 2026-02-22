interface NumberInputWithUnitProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  unit: string;
  id?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number | string;
  disabled?: boolean;
  style?: React.CSSProperties;
  hasError?: boolean;
  displayDecimals?: number;
}

export function NumberInputWithUnit({
  value,
  onChange,
  unit,
  id,
  placeholder,
  min,
  max,
  step = "any",
  disabled = false,
  style,
  hasError = false,
  displayDecimals,
}: NumberInputWithUnitProps) {
  const displayValue =
    value == null
      ? ""
      : typeof displayDecimals === "number"
        ? Math.round(value * 10 ** displayDecimals) / 10 ** displayDecimals
        : value;

  return (
    <div className="number-input-with-unit-wrapper">
      <input
        id={id}
        type="number"
        value={displayValue}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={`number-input-with-unit-input ${hasError ? "number-input-with-unit-input-error" : ""}`}
        style={style}
      />
      <span className="number-input-with-unit-label">{unit}</span>
    </div>
  );
}
