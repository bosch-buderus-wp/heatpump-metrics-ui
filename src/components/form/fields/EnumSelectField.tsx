import { useTranslation } from "react-i18next";

interface EnumSelectFieldProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  enumKey: string; // e.g., "building_type", "building_energy_standard"
  enumValues: string[]; // e.g., ["single_family_detached", "semi_detached", ...]
  translationPrefix: string; // e.g., "models.building_type"
}

export function EnumSelectField({
  label,
  value,
  onChange,
  enumKey,
  enumValues,
  translationPrefix,
}: EnumSelectFieldProps) {
  const { t } = useTranslation();

  const id = `select-field-${enumKey}`;
  return (
    <div className="row">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">-</option>
        {enumValues.map((enumValue) => (
          <option key={enumValue} value={enumValue}>
            {t(`${translationPrefix}.${enumValue}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
