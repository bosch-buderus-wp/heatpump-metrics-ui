import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AzYearlyEnergyScatterChart,
  type YearlyEnergyScatterDataPoint,
} from "../components/common/charts";
import { DataGridWrapper } from "../components/common/data-grid";
import { PageLayout } from "../components/common/layout";
import { useComparisonMode } from "../hooks/useComparisonMode";
import { createFilterValueResolver } from "../lib/filterValueResolver";
import { supabase } from "../lib/supabaseClient";
import { commonHiddenColumns, getTimeSeriesColumns } from "../lib/tableHelpers";
import type { Database } from "../types/database.types";

type MonthlyValue = Database["public"]["Views"]["monthly_values_view"]["Row"];

export default function AzEnergyEvaluation() {
  const { t } = useTranslation();
  const [filteredData, setFilteredData] = useState<MonthlyValue[] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Get current user's ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  // Debounced filter change handler to prevent rapid updates
  const handleFilterChange = useCallback((data: MonthlyValue[]) => {
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
  const columns = useMemo(() => getTimeSeriesColumns(t, "month"), [t]);
  const filterValueResolver = useMemo(
    () => createFilterValueResolver<MonthlyValue>(columns),
    [columns],
  );

  // Fetch monthly values except the current (potentially incomplete) month
  const { data, isLoading, error } = useQuery<MonthlyValue[]>({
    queryKey: ["monthly_all_for_az_energy", currentYear, currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_values_view")
        .select("*")
        .not("year", "is", null)
        .not("month", "is", null)
        .or(`year.lt.${currentYear},and(year.eq.${currentYear},month.lt.${currentMonth})`)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (error) throw error;

      return data as MonthlyValue[];
    },
  });

  // Use comparison mode hook
  const { dataGridComparisonProps } = useComparisonMode(data, filterValueResolver);

  // Prepare scatter plot data (use filtered data if available)
  const scatterData: YearlyEnergyScatterDataPoint[] = useMemo(() => {
    const dataToUse = filteredData !== null ? filteredData : data || [];
    return dataToUse.map((row) => ({
      heating_id: row.heating_id,
      user_id: row.user_id,
      name: row.name,
      year: row.year,
      month: row.month,
      heated_area_m2: row.heated_area_m2,
      thermal_energy_heating_kwh: row.thermal_energy_heating_kwh,
      electrical_energy_heating_kwh: row.electrical_energy_heating_kwh,
    }));
  }, [data, filteredData]);

  // Memoize the chart component to prevent unnecessary re-renders
  const chartComponent = useMemo(() => {
    return <AzYearlyEnergyScatterChart data={scatterData} currentUserId={currentUserId} />;
  }, [scatterData, currentUserId]);

  return (
    <PageLayout
      titleKey="azEnergyEvaluation.title"
      infoKey="azEnergyEvaluation.info"
      error={error}
      isLoading={isLoading}
      chart={chartComponent}
    >
      <DataGridWrapper
        rows={data || []}
        columns={columns}
        loading={isLoading}
        getRowId={(row) =>
          typeof row.id === "string" || typeof row.id === "number"
            ? row.id
            : `${row.heating_id}-${row.month}-${row.year}`
        }
        columnVisibilityModel={commonHiddenColumns}
        onFilterChange={handleFilterChange}
        {...dataGridComparisonProps}
      />
    </PageLayout>
  );
}
