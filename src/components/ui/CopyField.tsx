import { useState } from "react";
import { useTranslation } from "react-i18next";

interface CopyFieldProps {
  label: string;
  value: string;
}

export function CopyField({ label, value }: CopyFieldProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const id = `copy-field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="row">
      <label htmlFor={id}>{label}</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input id={id} type="text" value={value} readOnly style={{ flex: 1 }} />
        <button type="button" onClick={handleCopy}>
          {copied ? t("common.copied") : t("common.copy")}
        </button>
      </div>
    </div>
  );
}
