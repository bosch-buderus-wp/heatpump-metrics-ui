import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HeatingCurveChart, type HeatingCurveDataPoint } from "../components/common/charts";
import { DataGridWrapper } from "../components/common/data-grid";
import { PageLayout } from "../components/common/layout";
import { useComparisonMode } from "../hooks/useComparisonMode";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { createFilterValueResolver } from "../lib/filterValueResolver";
import { sanitizeGridFilterModel } from "../lib/serverFilterModel";
import { supabase } from "../lib/supabaseClient";
import { commonHiddenColumns, getTimeSeriesColumns } from "../lib/tableHelpers";
import type { Database } from "../types/database.types";

type DailyValue = Database["public"]["Views"]["daily_values_view"]["Row"];

const MAX_SAMPLE_ROWS = 1000;
const OUTDOOR_TEMPERATURE_BIN_WIDTH_K = 2;
const FILTER_REQUEST_DEBOUNCE_MS = 700;

export default function HeatingCurve() {
  const { t } = useTranslation();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user's ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  // Define columns for HeatingCurve page (same as Monthly)
  const columns = useMemo(() => getTimeSeriesColumns(t, "date"), [t]);
  const filterValueResolver = useMemo(
    () => createFilterValueResolver<DailyValue>(columns),
    [columns],
  );
  const { dataGridComparisonProps, activeFilterModel } = useComparisonMode(
    undefined,
    filterValueResolver,
  );
  const debouncedFilterModel = useDebouncedValue(activeFilterModel, FILTER_REQUEST_DEBOUNCE_MS);
  const serverFilterModel = useMemo(
    () => sanitizeGridFilterModel(debouncedFilterModel),
    [debouncedFilterModel],
  );

  // Fetch sampled daily values via RPC. The RPC operates on the corrected outdoor_temperature_c.
  const { data, isLoading, error } = useQuery<DailyValue[]>({
    queryKey: [
      "sample_daily_values_view_by_outdoor_temperature",
      JSON.stringify(serverFilterModel),
      currentUserId,
      MAX_SAMPLE_ROWS,
      OUTDOOR_TEMPERATURE_BIN_WIDTH_K,
    ],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "sample_daily_values_view_by_outdoor_temperature",
        {
          filter_model: serverFilterModel,
          max_rows: MAX_SAMPLE_ROWS,
          outdoor_temperature_bin_width_k: OUTDOOR_TEMPERATURE_BIN_WIDTH_K,
          current_user_id: currentUserId,
        },
      );

      if (error) throw error;

      return (data ?? []) as DailyValue[];
    },
    placeholderData: (previousData) => previousData,
  });

  // Prepare scatter plot data.
  const chartData: HeatingCurveDataPoint[] = useMemo(() => {
    const dataToUse = data ?? [];
    return dataToUse.map((row) => ({
      outdoor_temperature_c: row.outdoor_temperature_c,
      flow_temperature_c: row.flow_temperature_c,
      heating_id: row.heating_id,
      name: row.name,
      date: row.date,
      user_id: row.user_id,
    }));
  }, [data]);

  // Memoize the chart component to prevent unnecessary re-renders
  const chartComponent = useMemo(() => {
    return <HeatingCurveChart data={chartData} currentUserId={currentUserId} />;
  }, [chartData, currentUserId]);

  return (
    <PageLayout
      titleKey="heatingCurve.title"
      infoKey="heatingCurve.info"
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
        {...dataGridComparisonProps}
      />
    </PageLayout>
  );
}
