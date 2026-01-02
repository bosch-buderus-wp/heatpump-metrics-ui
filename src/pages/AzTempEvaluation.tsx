import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AzScatterChart, type ScatterDataPoint } from "../components/common/charts";
import { DataGridWrapper } from "../components/common/data-grid";
import { PageLayout } from "../components/common/layout";
import { useComparisonMode } from "../hooks/useComparisonMode";
import { supabase } from "../lib/supabaseClient";
import { commonHiddenColumns, getAllDataGridColumns } from "../lib/tableHelpers";
import type { Database } from "../types/database.types";

type DailyValue = Database["public"]["Views"]["daily_values"]["Row"];

export default function AzTempEvaluation() {
  const { t } = useTranslation();
  const [filteredData, setFilteredData] = useState<DailyValue[] | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced filter change handler to prevent rapid updates
  const handleFilterChange = useCallback((data: DailyValue[]) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to update after 300ms
    timeoutRef.current = setTimeout(() => {
      setFilteredData(data);
    }, 300);
  }, []);

  // Define columns
  const columns = useMemo(() => {
    const cols = getAllDataGridColumns(t);
    return [
      cols.user_id,
      cols.date,
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
      cols.az,
      cols.azHeating,
      cols.outdoorTemperature,
      cols.flowTemperature,
    ];
  }, [t]);

  // Fetch all daily values
  const { data, isLoading, error } = useQuery({
    queryKey: ["daily_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_values")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return data as DailyValue[];
    },
  });

  // Use comparison mode hook
  const { dataGridComparisonProps } = useComparisonMode(data);

  // Prepare scatter plot data (use filtered data if available)
  const scatterData: ScatterDataPoint[] = useMemo(() => {
    const dataToUse = filteredData !== null ? filteredData : data || [];
    return dataToUse.map((row) => ({
      az: row.az,
      az_heating: row.az_heating,
      outdoor_temperature_c: row.outdoor_temperature_c,
      flow_temperature_c: row.flow_temperature_c,
      heating_id: row.heating_id,
      name: row.name,
      date: row.date,
    }));
  }, [data, filteredData]);

  // Memoize the chart component to prevent unnecessary re-renders
  const chartComponent = useMemo(() => {
    return <AzScatterChart data={scatterData} />;
  }, [scatterData]);

  return (
    <PageLayout
      titleKey="azTempEvaluation.title"
      infoKey="azTempEvaluation.info"
      error={error}
      isLoading={isLoading}
      chart={chartComponent}
    >
      <DataGridWrapper
        rows={data || []}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => `${row.heating_id}-${row.date}`}
        columnVisibilityModel={commonHiddenColumns}
        onFilterChange={handleFilterChange}
        {...dataGridComparisonProps}
      />
    </PageLayout>
  );
}
