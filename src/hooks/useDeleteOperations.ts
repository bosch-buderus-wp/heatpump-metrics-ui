import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      // Delete account via edge function
      // The edge function will handle cascade deletion of all user data
      // The Supabase client automatically includes the Authorization header from the current session
      const { data, error } = await supabase.functions.invoke("delete-account");

      if (error) {
        console.error("Error from edge function:", error);
        throw error;
      }

      return data;
    },
  });
}

export function useDeleteMeasurement() {
  return useMutation({
    mutationFn: async (measurementId: string) => {
      const { error } = await supabase.from("measurements").delete().eq("id", measurementId);

      if (error) {
        console.error("Error deleting measurement:", error);
        throw error;
      }
    },
  });
}

export interface DeleteSystemCounts {
  monthlyCount: number;
  measurementCount: number;
}

export async function getDeleteSystemCounts(heatingId: string): Promise<DeleteSystemCounts> {
  const [monthlyRes, measurementRes] = await Promise.all([
    supabase
      .from("monthly_values")
      .select("id", { count: "exact", head: true })
      .eq("heating_id", heatingId),
    supabase
      .from("measurements")
      .select("id", { count: "exact", head: true })
      .eq("heating_id", heatingId),
  ]);

  return {
    monthlyCount: monthlyRes.count ?? 0,
    measurementCount: measurementRes.count ?? 0,
  };
}

export interface DeleteAccountCounts extends DeleteSystemCounts {
  systemCount: number;
}

export async function getDeleteAccountCounts(userId: string): Promise<DeleteAccountCounts> {
  const systemsRes = await supabase
    .from("heating_systems")
    .select("heating_id")
    .eq("user_id", userId);

  const heatingIds = systemsRes.data?.map((s) => s.heating_id) ?? [];

  if (heatingIds.length === 0) {
    return { systemCount: 0, monthlyCount: 0, measurementCount: 0 };
  }

  const [monthlyRes, measurementRes] = await Promise.all([
    supabase
      .from("monthly_values")
      .select("id", { count: "exact", head: true })
      .in("heating_id", heatingIds),
    supabase
      .from("measurements")
      .select("id", { count: "exact", head: true })
      .in("heating_id", heatingIds),
  ]);

  return {
    systemCount: heatingIds.length,
    monthlyCount: monthlyRes.count ?? 0,
    measurementCount: measurementRes.count ?? 0,
  };
}
