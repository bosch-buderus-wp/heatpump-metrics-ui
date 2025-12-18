import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { ProfileSection } from "../components/features/profile";
import { SystemSection } from "../components/features/system";
import { MonthlyValuesSection } from "../components/features/monthly";
import { useProfile, useUpdateProfile } from "../hooks/useProfile";
import { useSystem, useCreateSystem, useUpdateSystem, useDeleteSystem } from "../hooks/useSystem";
import {
  useMonthlyValues,
  useCreateMonthlyValue,
  useUpdateMonthlyValue,
  useDeleteMonthlyValue,
} from "../hooks/useMonthlyValues";
import { useDeleteAccount, getDeleteAccountCounts } from "../hooks/useDeleteOperations";
import type { Database } from "../types/database.types";

type HeatingSystemInsert = Database["public"]["Tables"]["heating_systems"]["Insert"];
type MonthlyValueInsert = Database["public"]["Tables"]["monthly_values"]["Insert"];

export default function MyAccount() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Session management
  const [sessionChecked, setSessionChecked] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
      setSessionChecked(true);
      if (!session) {
        navigate("/login");
      }
    });
  }, [navigate]);

  // Data queries
  const profileQuery = useProfile(userId);
  const systemQuery = useSystem(userId);
  const system = systemQuery.data;
  const monthlyQuery = useMonthlyValues(system?.heating_id);

  // Mutations
  const updateProfile = useUpdateProfile(userId);
  const createSystem = useCreateSystem(userId);
  const updateSystem = useUpdateSystem(userId, system?.heating_id);
  const deleteSystem = useDeleteSystem(userId, system?.heating_id);
  const deleteAccountMutation = useDeleteAccount();
  const createMonthly = useCreateMonthlyValue(system?.heating_id);
  const updateMonthly = useUpdateMonthlyValue(system?.heating_id);
  const deleteMonthly = useDeleteMonthlyValue(system?.heating_id);

  // UI state
  const [deleteAccountCounts, setDeleteAccountCounts] = useState<{
    systemCount: number;
    monthlyCount: number;
    measurementCount: number;
  } | null>(null);

  // Profile save handler
  const handleProfileSave = async (name: string) => {
    try {
      await updateProfile.mutateAsync(name);
    } catch (error) {
      console.error("Profile save error:", error);
      throw error;
    }
  };

  // System save handler
  const handleSystemSave = async (payload: HeatingSystemInsert) => {
    if (system) {
      await updateSystem.mutateAsync(payload);
    } else {
      await createSystem.mutateAsync(payload);
    }
  };

  // System delete handler
  const handleSystemDelete = async () => {
    await deleteSystem.mutateAsync();
  };

  // Monthly save handler
  const handleMonthlySave = async (val: MonthlyValueInsert) => {
    // Set is_manual_override to true to prevent automatic calculation from overriding
    const valWithOverride = { ...val, is_manual_override: true };

    if (val.id) {
      await updateMonthly.mutateAsync({ id: String(val.id), values: valWithOverride });
    } else {
      await createMonthly.mutateAsync(valWithOverride);
    }
  };

  // Monthly delete handler
  const handleMonthlyDelete = async (id: string) => {
    await deleteMonthly.mutateAsync(id);
  };

  // Fetch delete account counts on mount
  useEffect(() => {
    if (userId) {
      getDeleteAccountCounts(userId).then(setDeleteAccountCounts);
    }
  }, [userId]);

  // Account deletion handlers
  const handleDeleteAccount = async () => {
    if (!userId) return;

    await deleteAccountMutation.mutateAsync();

    // Sign out and redirect
    await handleLogout();
  };

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate("/login");
  };

  if (!sessionChecked) return null;

  return (
    <div>
      {/* Profile Section */}
      {profileQuery.isLoading ? (
        <div>{t("common.loading")}</div>
      ) : profileQuery.data ? (
        <section className="section-container">
          <ProfileSection
            profile={profileQuery.data}
            onSave={handleProfileSave}
            onLogout={handleLogout}
            onDelete={handleDeleteAccount}
            deleteAccountCounts={deleteAccountCounts}
          />
        </section>
      ) : null}

      {/* System Section */}
      {systemQuery.isLoading ? (
        <div>{t("common.loading")}</div>
      ) : (
        <div className="section-container">
          <SystemSection
            system={system ?? null}
            onSave={handleSystemSave}
            onDelete={handleSystemDelete}
          />
        </div>
      )}

      {/* Monthly Values Section */}
      {system &&
        (monthlyQuery.isLoading ? (
          <div>{t("common.loading")}</div>
        ) : (
          <div className="section-container">
            <MonthlyValuesSection
              system={system}
              values={monthlyQuery.data ?? []}
              onSave={handleMonthlySave}
              onDelete={handleMonthlyDelete}
            />
          </div>
        ))}
    </div>
  );
}
