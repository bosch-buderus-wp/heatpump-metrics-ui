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
      <div className="copy-field-wrapper">
        <input id={id} type="text" value={value} readOnly className="copy-field-input" />
        <button type="button" onClick={handleCopy}>
          {copied ? t("common.copied") : t("common.copy")}
        </button>
      </div>
    </div>
  );
}
