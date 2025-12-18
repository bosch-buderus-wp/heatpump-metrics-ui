import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { Database } from "../types/database.types";

type HeatingSystem = Database["public"]["Tables"]["heating_systems"]["Row"];
type HeatingSystemInsert = Database["public"]["Tables"]["heating_systems"]["Insert"];
type HeatingSystemUpdate = Database["public"]["Tables"]["heating_systems"]["Update"];

export function useSystem(userId: string | undefined) {
  return useQuery({
    queryKey: ["heating_system", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID");
      const { data, error } = await supabase
        .from("heating_systems")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as HeatingSystem | null;
    },
    enabled: !!userId,
  });
}

export function useCreateSystem(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: Partial<HeatingSystemInsert>) => {
      if (!userId) throw new Error("No user ID");
      const { data, error } = await supabase
        .from("heating_systems")
        .insert({ ...values, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heating_system", userId] });
    },
  });
}

export function useUpdateSystem(userId: string | undefined, heatingId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: Partial<HeatingSystemUpdate>) => {
      if (!heatingId) throw new Error("No system ID");
      const { data, error } = await supabase
        .from("heating_systems")
        .update(values)
        .eq("heating_id", heatingId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heating_system", userId] });
    },
  });
}

export function useDeleteSystem(userId: string | undefined, heatingId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!heatingId) throw new Error("No system ID");
      const { error } = await supabase.from("heating_systems").delete().eq("heating_id", heatingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heating_system", userId] });
      queryClient.invalidateQueries({ queryKey: ["monthly_values"] });
      queryClient.invalidateQueries({ queryKey: ["measurements"] });
    },
  });
}

export function useSystemRecordCounts(heatingId: string | undefined) {
  return useQuery({
    queryKey: ["system_record_counts", heatingId],
    queryFn: async () => {
      if (!heatingId) return { monthlyCount: 0, measurementCount: 0 };

      const [monthlyResult, measurementResult] = await Promise.all([
        supabase
          .from("monthly_values")
          .select("*", { count: "exact", head: true })
          .eq("heating_id", heatingId),
        supabase
          .from("measurements")
          .select("*", { count: "exact", head: true })
          .eq("heating_id", heatingId),
      ]);

      if (monthlyResult.error) throw monthlyResult.error;
      if (measurementResult.error) throw measurementResult.error;

      return {
        monthlyCount: monthlyResult.count || 0,
        measurementCount: measurementResult.count || 0,
      };
    },
    enabled: !!heatingId,
  });
}
