import type { GridFilterModel } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HeatingLoadChart } from "../components/common/charts/HeatingLoadChart";
import { DataGridWrapper } from "../components/common/data-grid";
import { PageLayout } from "../components/common/layout";
import { useSession } from "../components/common/layout/Layout";
import { useModelFamily } from "../hooks/useModelFamily";
import type { HeatingLoadDailyValue } from "../lib/heatingLoad";
import { supabase } from "../lib/supabaseClient";
import { getBaseSystemColumns } from "../lib/tableHelpers";
import type { HeatingSystemWithLocation } from "../types/database.types";
import "../styles/components/heating-load.css";

const PAGE_SIZE = 1000;

type SelectableSystem = HeatingSystemWithLocation & { heating_id: string };

async function fetchSystems(family: string): Promise<SelectableSystem[]> {
  const rows: SelectableSystem[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("heating_systems_with_location_view")
      .select("*")
      .eq("model_family_id", family)
      .order("heating_id")
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []).filter((row): row is SelectableSystem => row.heating_id != null);
    rows.push(...page);
    if ((data ?? []).length < PAGE_SIZE) return rows;
  }
}

async function fetchDailyValues(heatingId: string): Promise<HeatingLoadDailyValue[]> {
  const rows: HeatingLoadDailyValue[] = [];
  // The database view groups by date in the UTC database session. Omit today's partial day.
  const today = new Date().toISOString().slice(0, 10);
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("daily_values_view")
      .select("date,outdoor_temperature_c,thermal_energy_heating_kwh")
      .eq("heating_id", heatingId)
      .lt("date", today)
      .order("date", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data ?? []).length < PAGE_SIZE) return rows;
  }
}

export default function HeatingLoad() {
  const { family } = useModelFamily();
  const { session } = useSession();
  const { t } = useTranslation();
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [filterModel, setFilterModel] = useState<GridFilterModel | undefined>(undefined);
  const columns = useMemo(() => getBaseSystemColumns(t), [t]);
  const systems = useQuery({
    queryKey: ["heating-load-systems", family],
    queryFn: () => fetchSystems(family),
  });
  const selectedSystem =
    (systems.data ?? []).find((row) => row.heating_id === chosenId) ??
    (chosenId == null && session?.user?.id
      ? (systems.data ?? []).find((row) => row.user_id === session.user.id)
      : undefined);
  const daily = useQuery({
    queryKey: ["heating-load-daily", selectedSystem?.heating_id],
    queryFn: () => {
      if (!selectedSystem) throw new Error("No heating system selected");
      return fetchDailyValues(selectedSystem.heating_id);
    },
    enabled: !!selectedSystem,
  });

  return (
    <PageLayout
      className="heating-load-page"
      titleKey="heatingLoad.title"
      infoKey="heatingLoad.info"
      error={systems.error ?? daily.error}
      isLoading={systems.isLoading}
      chart={
        selectedSystem ? (
          <HeatingLoadChart
            values={daily.data ?? []}
            systemName={selectedSystem.name || t("systems.unnamedSystem")}
            designTemperature={selectedSystem.design_outdoor_temp_c}
            declaredLoad={selectedSystem.heating_load_kw}
            isLoading={daily.isLoading}
          />
        ) : (
          <div className="chart-no-data-card card">
            <p className="muted">{t("heatingLoad.selectSystem")}</p>
          </div>
        )
      }
    >
      <p className="muted">{t("heatingLoad.selectSystem")}</p>
      <DataGridWrapper
        rows={systems.data ?? []}
        columns={columns}
        loading={systems.isLoading}
        getRowId={(row) => row.heating_id}
        activeFilterModel={filterModel}
        onFilterModelChange={setFilterModel}
        selectedRowId={selectedSystem?.heating_id}
        onSelectRow={(row) => setChosenId(row.heating_id)}
        columnVisibilityModel={{
          user_id: false,
          sw_idu: false,
          sw_odu: false,
          building_construction_year: false,
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
