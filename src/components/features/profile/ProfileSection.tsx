import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CopyField } from "../../ui/CopyField";
import { ActionBar, type ActionButton } from "../../ui/ActionBar";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import type { Profile } from "../../../hooks/useProfile";

interface ProfileSectionProps {
  profile: Profile;
  onSave: (name: string) => Promise<void>;
  onLogout?: () => void;
  onDelete?: () => Promise<void>;
  deleteAccountCounts?: {
    systemCount: number;
    monthlyCount: number;
    measurementCount: number;
  } | null;
}

export function ProfileSection({
  profile,
  onSave,
  onLogout,
  onDelete,
  deleteAccountCounts,
}: ProfileSectionProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(profile.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      await onSave(name);
      setFeedback({ type: "success", message: `${t("common.save")} ✓` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common.error");
      setFeedback({ type: "error", message });
    } finally {
      setIsSaving(false);
    }
  };

  const actions: ActionButton[] = [
    {
      label: t("common.save"),
      onClick: () => {
        const formElement = document.getElementById("profile-form") as HTMLFormElement;
        if (formElement) formElement.requestSubmit();
      },
      variant: "primary",
      disabled: isSaving,
      icon: "💾",
    },
  ];

  if (onLogout) {
    actions.push({
      label: t("nav.logout"),
      onClick: onLogout,
      variant: "secondary",
      icon: "➜]",
    });
  }

  if (onDelete) {
    actions.push({
      label: t("deleteConfirm.deleteAccount"),
      onClick: () => setShowDeleteConfirm(true),
      variant: "danger",
      icon: "🗑️",
    });
  }

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleteInProgress(true);
    try {
      await onDelete();
      setShowDeleteConfirm(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common.error");
      setFeedback({ type: "error", message });
    } finally {
      setDeleteInProgress(false);
    }
  };

  return (
    <section>
      <div className="section-header">
        <h2>{t("dash.profile")}</h2>
      </div>

      <div className="section-info">
        <p>{t("dash.profileInfo")}</p>
      </div>

      <div className="section-content">
        {profile.api_key && <CopyField label={t("dash.apiKey")} value={profile.api_key} />}
      </div>

      <form id="profile-form" onSubmit={handleSubmit} className="section-form">
        <div className="row">
          <label htmlFor="profile-username">{t("dash.username")}</label>
          <input
            id="profile-username"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </form>

      <ActionBar actions={actions} feedback={feedback} />

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t("deleteConfirm.deleteAccount")}
        message={
          deleteAccountCounts
            ? t("deleteConfirm.deleteAccountMessage", {
                systemCount: deleteAccountCounts.systemCount,
                monthlyCount: deleteAccountCounts.monthlyCount,
                measurementCount: deleteAccountCounts.measurementCount,
              })
            : ""
        }
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={deleteInProgress}
        loadingText={t("deleteConfirm.deleting")}
      />
    </section>
  );
}
