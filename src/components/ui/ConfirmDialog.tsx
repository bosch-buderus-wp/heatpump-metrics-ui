import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  loadingText?: string;
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
  loadingText,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="modal-overlay"
      onClick={onCancel}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <h2 id="dialog-title">{title}</h2>
        <p id="dialog-description" style={{ whiteSpace: "pre-line" }}>
          {message}
        </p>
        <div className="modal-buttons">
          <button type="button" onClick={onCancel} disabled={isLoading}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{ backgroundColor: "var(--danger-color, #dc3545)" }}
          >
            {isLoading ? loadingText || t("common.loading") : t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
