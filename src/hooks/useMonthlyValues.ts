import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { Database } from "../types/database.types";

type MonthlyValue = Database["public"]["Tables"]["monthly_values"]["Row"];
type MonthlyValueInsert = Database["public"]["Tables"]["monthly_values"]["Insert"];
type MonthlyValueUpdate = Database["public"]["Tables"]["monthly_values"]["Update"];

export function useMonthlyValues(heatingId: string | undefined) {
  return useQuery({
    queryKey: ["monthly_values", heatingId],
    queryFn: async () => {
      if (!heatingId) throw new Error("No heating ID");
      const { data, error } = await supabase
        .from("monthly_values")
        .select("*")
        .eq("heating_id", heatingId)
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      if (error) throw error;
      return data as MonthlyValue[];
    },
    enabled: !!heatingId,
  });
}

export function useCreateMonthlyValue(heatingId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: Omit<MonthlyValueInsert, "heating_id">) => {
      if (!heatingId) throw new Error("No heating ID");
      const { data, error } = await supabase
        .from("monthly_values")
        .insert({ ...values, heating_id: heatingId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly_values", heatingId] });
    },
  });
}

export function useUpdateMonthlyValue(heatingId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<MonthlyValueUpdate> }) => {
      const { data, error } = await supabase
        .from("monthly_values")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly_values", heatingId] });
    },
  });
}

export function useDeleteMonthlyValue(heatingId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("monthly_values").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly_values", heatingId] });
    },
  });
}
