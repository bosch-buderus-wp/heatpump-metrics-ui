import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useTranslation } from "react-i18next";
import { PageLayout } from "../components/common/layout";
import { DataGridWrapper } from "../components/common/data-grid";
import { getAllDataGridColumns } from "../lib/tableHelpers";

export default function Systems() {
  const { t } = useTranslation();

  // Define columns specific to Systems page
  const columns = (() => {
    const cols = getAllDataGridColumns(t);
    return [
      cols.user_id,
      cols.name,
      cols.postalCode,
      cols.country,
      cols.heatingType,
      cols.modelIdu,
      cols.modelOdu,
      cols.swIdu,
      cols.swOdu,
      cols.heatingLoad,
      cols.heatedArea,
      cols.buildingConstructionYear,
      cols.designOutdoorTemp,
      cols.buildingType,
      cols.buildingEnergyStandard,
      cols.usedForHeating,
      cols.usedForDhw,
      cols.usedForCooling,
    ];
  })();

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
