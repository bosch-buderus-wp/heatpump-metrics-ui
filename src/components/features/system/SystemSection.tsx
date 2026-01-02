import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSystemRecordCounts } from "../../../hooks/useSystem";
import type { Database } from "../../../types/database.types";
import { ActionBar, type ActionButton } from "../../ui/ActionBar";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { CopyField } from "../../ui/CopyField";
import { SystemForm } from "./SystemForm";

type HeatingSystem = Database["public"]["Tables"]["heating_systems"]["Row"];
type HeatingSystemInsert = Database["public"]["Tables"]["heating_systems"]["Insert"];

interface SystemSectionProps {
  system: HeatingSystem | null;
  onSave: (payload: HeatingSystemInsert) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function SystemSection({ system, onSave, onDelete }: SystemSectionProps) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const { data: recordCounts } = useSystemRecordCounts(system?.heating_id);

  const handleSave = async (payload: HeatingSystemInsert) => {
    setIsSaving(true);
    setFeedback(null);
    try {
      await onSave(payload);
      setFeedback({ type: "success", message: `${t("common.save")} ✓` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common.error");
      setFeedback({ type: "error", message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteInProgress(true);
    try {
      await onDelete();
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteInProgress(false);
    }
  };

  const actions: ActionButton[] = [
    {
      label: t("common.save"),
      onClick: () => {
        // Trigger form submit via form element
        const formElement = document.getElementById("system-form") as HTMLFormElement;
        if (formElement) formElement.requestSubmit();
      },
      variant: "primary",
      disabled: isSaving,
      icon: "💾",
    },
  ];

  if (system) {
    actions.push({
      label: t("deleteConfirm.deleteSystem"),
      onClick: () => setShowDeleteConfirm(true),
      variant: "danger",
      icon: "🗑️",
    });
  }

  return (
    <section>
      <div className="section-header">
        <h2>{t("dash.systems")}</h2>
      </div>

      <div className="section-info">
        <p>{t("dash.systemsInfo")}</p>
      </div>

      <div className="section-content">
        {system?.heating_id && (
          <CopyField label={t("systemForm.heatingId")} value={system.heating_id} />
        )}
      </div>

      <div className="section-form">
        <SystemForm system={system} onSubmit={handleSave} />
      </div>

      <ActionBar actions={actions} feedback={feedback} />

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t("deleteConfirm.deleteSystem")}
        message={t("deleteConfirm.deleteSystemMessage", {
          monthlyCount: recordCounts?.monthlyCount || 0,
          measurementCount: recordCounts?.measurementCount || 0,
        })}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={deleteInProgress}
        loadingText={t("deleteConfirm.deleting")}
      />
    </section>
  );
}
