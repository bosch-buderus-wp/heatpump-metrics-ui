import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { Tables } from "../types/database.types";
export function useModelCatalog() {
  return useQuery({
    queryKey: ["model-catalog"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [families, combinations] = await Promise.all([
        supabase.from("model_families").select("*").order("sort_order"),
        supabase.from("model_combinations").select("*").order("model_idu").order("model_odu"),
      ]);
      if (families.error) throw families.error;
      if (combinations.error) throw combinations.error;
      return {
        families: families.data as Tables<"model_families">[],
        combinations: combinations.data as Tables<"model_combinations">[],
      };
    },
  });
}
