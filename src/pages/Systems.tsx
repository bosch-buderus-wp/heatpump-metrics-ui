import type { GridFilterModel } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SystemsGeoMap } from "../components/common/charts";
import { DataGridWrapper } from "../components/common/data-grid";
import { PageLayout } from "../components/common/layout";
import { useModelFamily } from "../hooks/useModelFamily";
import { applyGridFilterModel } from "../lib/filterModelUtils";
import { createFilterValueResolver } from "../lib/filterValueResolver";
import { supabase } from "../lib/supabaseClient";
import { getBaseSystemColumns } from "../lib/tableHelpers";
import type { HeatingSystemWithLocation } from "../types/database.types";

export default function Systems() {
  const { family } = useModelFamily();
  const { t } = useTranslation();
  const [filterModel, setFilterModel] = useState<GridFilterModel | undefined>(undefined);

  // Define columns for Systems page
  const columns = useMemo(() => getBaseSystemColumns(t), [t]);
  const resolveFilterValue = useMemo(
    () => createFilterValueResolver<HeatingSystemWithLocation & Record<string, unknown>>(columns),
    [columns],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["systems-with-location", family],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("heating_systems_with_location_view")
        .select("*")
        .eq("model_family_id", family)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as HeatingSystemWithLocation[];
    },
  });

  // Handle clicking on a map marker - filter the data grid
  const handleSystemClick = useCallback((heatingIds: string[]) => {
    setFilterModel({
      items: [
        {
          field: "heating_id",
          operator: "isAnyOf",
          value: heatingIds,
        },
      ],
    });
  }, []);

  const filteredSystems = useMemo(
    () =>
      applyGridFilterModel(
        (data ?? []) as Array<HeatingSystemWithLocation & Record<string, unknown>>,
        filterModel,
        resolveFilterValue,
      ),
    [data, filterModel, resolveFilterValue],
  );

  // Memoize the map component to prevent unnecessary re-renders
  const mapComponent = useMemo(() => {
    if (!data) return null;
    return <SystemsGeoMap systems={filteredSystems} onSystemClick={handleSystemClick} />;
  }, [data, filteredSystems, handleSystemClick]);

  return (
    <PageLayout
      titleKey="systems.title"
      infoKey="systems.info"
      error={error}
      isLoading={isLoading}
      chart={mapComponent}
    >
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
          latitude_deg: false,
          longitude_deg: false,
        }}
        activeFilterModel={filterModel}
        onFilterModelChange={setFilterModel}
      />
    </PageLayout>
  );
}
