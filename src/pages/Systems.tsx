import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { DataGridWrapper } from "../components/common/data-grid";
import { PageLayout } from "../components/common/layout";
import { supabase } from "../lib/supabaseClient";
import { getBaseSystemColumns } from "../lib/tableHelpers";

export default function Systems() {
  const { t } = useTranslation();

  // Define columns for Systems page
  const columns = getBaseSystemColumns(t);

  const { data, isLoading, error } = useQuery({
    queryKey: ["systems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("heating_systems")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <PageLayout titleKey="systems.title" infoKey="systems.info" error={error} isLoading={isLoading}>
      <DataGridWrapper
        rows={data ?? []}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.heating_id}
        columnVisibilityModel={{
          user_id: false,
          sw_idu: false,
          sw_odu: false,
          heating_load_kw: false,
          building_construction_year: false,
          design_outdoor_temp_c: false,
          building_type: false,
          building_energy_standard: false,
          used_for_heating: false,
          used_for_dhw: false,
          used_for_cooling: false,
        }}
      />
    </PageLayout>
  );
}
