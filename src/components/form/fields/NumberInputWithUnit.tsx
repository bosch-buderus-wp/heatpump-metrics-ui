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
}: NumberInputWithUnitProps) {
  return (
    <div style={{ position: "relative", flex: 1, display: "flex" }}>
      <input
        id={id}
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        style={{
          ...style,
          paddingRight: "3.5rem", // Make room for the unit
          flex: 1,
          borderColor: hasError ? "red" : undefined,
          borderWidth: hasError ? "2px" : undefined,
        }}
      />
      <span
        style={{
          position: "absolute",
          right: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#999",
          fontSize: "0.9rem",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {unit}
      </span>
    </div>
  );
}
