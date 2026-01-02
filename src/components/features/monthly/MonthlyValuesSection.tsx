import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Database } from "../../../types/database.types";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { MonthlyEditor } from "./MonthlyEditor";

type HeatingSystem = Database["public"]["Tables"]["heating_systems"]["Row"];
type MonthlyValue = Database["public"]["Tables"]["monthly_values"]["Row"];
type MonthlyValueInsert = Database["public"]["Tables"]["monthly_values"]["Insert"];

interface MonthlyValuesSectionProps {
  system: HeatingSystem;
  values: MonthlyValue[];
  onSave: (val: MonthlyValueInsert) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function MonthlyValuesSection({
  system,
  values,
  onSave,
  onDelete,
}: MonthlyValuesSectionProps) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [currentMonthlyId, setCurrentMonthlyId] = useState<string | null>(null);

  const handleSave = async (val: MonthlyValueInsert) => {
    setFeedback(null);
    try {
      await onSave(val);
      setFeedback({ type: "success", message: `${t("common.save")} ✓` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common.error");
      setFeedback({ type: "error", message });
    }
  };

  const handleDeleteClick = (id: string) => {
    setCurrentMonthlyId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete || !currentMonthlyId) return;
    setDeleteInProgress(true);
    try {
      await onDelete(currentMonthlyId);
      setShowDeleteConfirm(false);
      setCurrentMonthlyId(null);
    } catch (err) {
      console.error("Delete failed:", err);
      setFeedback({ type: "error", message: t("common.error") });
    } finally {
      setDeleteInProgress(false);
    }
  };

  return (
    <section>
      <div className="section-header">
        <h2>{t("dash.monthlyValues")}</h2>
      </div>

      <div className="section-info">
        <p>{t("dash.monthlyValuesInfo")}</p>
      </div>

      <div className="section-content">
        <MonthlyEditor
          system={system}
          values={values}
          onSave={handleSave}
          onDeleteClick={onDelete ? handleDeleteClick : undefined}
          feedback={feedback}
        />
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t("deleteConfirm.deleteMonthlyValue")}
        message={t("deleteConfirm.deleteMonthlyValueMessage")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={deleteInProgress}
        loadingText={t("deleteConfirm.deleting")}
      />
    </section>
  );
}
