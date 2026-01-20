import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AzBarChart, type ChartDataRow, HistogramChart } from "../components/common/charts";
import { DataGridWrapper } from "../components/common/data-grid";
import { PageLayout } from "../components/common/layout";
import { ConfirmDialog, MetricModeToggle, ViewModeToggle } from "../components/ui";
import { useComparisonMode } from "../hooks/useComparisonMode";
import { useDeleteMeasurement } from "../hooks/useDeleteOperations";
import { filterRealisticDataForCharts } from "../lib/dataQuality";
import { supabase } from "../lib/supabaseClient";
import { commonHiddenColumns, getTimeSeriesColumns } from "../lib/tableHelpers";
import type { Database } from "../types/database.types";

type MeasurementDeltaRow = Database["public"]["Views"]["measurement_deltas_view"]["Row"];
type ViewMode = "timeSeries" | "distribution";
type MetricMode = "cop" | "energy";

export default function Daily() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [filteredData, setFilteredData] = useState<MeasurementDeltaRow[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("timeSeries");
  const [metricMode, setMetricMode] = useState<MetricMode>("cop");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [measurementToDelete, setMeasurementToDelete] = useState<string | null>(null);

  // Delete mutation
  const deleteMutation = useDeleteMeasurement();

  // Wrap setFilteredData in useCallback to prevent infinite loops in DataGridWrapper
  const handleFilterChange = useCallback((data: MeasurementDeltaRow[]) => {
    setFilteredData(data);
  }, []);

  // Define columns for Daily page
  const columns = useMemo(() => getTimeSeriesColumns(t, "time"), [t]);

  // Memoize filter section to prevent recreating on every render
  const filterSection = useMemo(
    () => (
      <div className="filter-container">
        <div className="flex-center-gap-sm">
          <button
            type="button"
            onClick={() => setDate(dayjs(date).subtract(1, "day").format("YYYY-MM-DD"))}
            title={t("common.previousDay") || "Previous day"}
            className="nav-button"
          >
            ◀
          </button>
          <input
            id="daily-date-picker"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-input"
          />
          <button
            type="button"
            onClick={() => setDate(dayjs(date).add(1, "day").format("YYYY-MM-DD"))}
            title={t("common.nextDay") || "Next day"}
            className="nav-button"
          >
            ▶
          </button>
        </div>
        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
        <MetricModeToggle metricMode={metricMode} onChange={setMetricMode} />
      </div>
    ),
    [date, viewMode, metricMode, t],
  );

  // Handle delete action
  const handleDeleteClick = useCallback((rowId: string | number) => {
    setMeasurementToDelete(String(rowId));
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!measurementToDelete) return;

    try {
      await deleteMutation.mutateAsync(measurementToDelete);
      // Invalidate and refetch the measurement_deltas_view query
      await queryClient.invalidateQueries({ queryKey: ["measurement_deltas_view", date] });
      setDeleteDialogOpen(false);
      setMeasurementToDelete(null);
    } catch (error) {
      console.error("Failed to delete measurement:", error);
      // Error handling - the mutation will handle error display
    }
  }, [measurementToDelete, deleteMutation, queryClient, date]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setMeasurementToDelete(null);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["measurement_deltas_view", date],
    queryFn: async () => {
      const start = dayjs(date).startOf("day").toISOString();
      const end = dayjs(date).endOf("day").toISOString();
      const { data, error } = await supabase
        .from("measurement_deltas_view")
        .select("*")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MeasurementDeltaRow[];
    },
  });

  // Add hour field for chart grouping
  const sortedData = useMemo(() => {
    if (!data) return [];

    // View already provides deltas, AZ calculations, and temperature corrections
    // Just add hour field for chart grouping
    return data.map((row) => ({
      ...row,
      hour: dayjs(row.created_at).hour().toString(),
    }));
  }, [data]);

  // Comparison mode hook - handles all filter logic
  const {
    comparisonMode,
    comparisonGroupsForChart,
    filteredDataForChart,
    dataGridComparisonProps,
  } = useComparisonMode(sortedData);

  // Filter out unrealistic data for charts (hourly data)
  const realisticDataForChart = useMemo(() => {
    if (!filteredDataForChart) return null;
    return filterRealisticDataForCharts(filteredDataForChart, true); // true = hourly data
  }, [filteredDataForChart]);

  const realisticComparisonGroups = useMemo(() => {
    if (!comparisonGroupsForChart) return undefined;
    return comparisonGroupsForChart.map((group) => ({
      ...group,
      data: filterRealisticDataForCharts(group.data, true), // true = hourly data
    }));
  }, [comparisonGroupsForChart]);

  // Get the data to use for histogram (filtered if available)
  // The view provides deltas, but the histogram in energy mode needs total consumption per system
  // We can sum the deltas to get the same result as (last - first) cumulative values
  const histogramDataSource = useMemo(() => {
    // Determine which filtered data to use
    const sourceData = filteredDataForChart || filteredData || sortedData;

    // Group deltas by heating_id and sum them
    const systemTotals = new Map<
      string,
      {
        thermal_energy_kwh: number;
        electrical_energy_kwh: number;
        thermal_energy_heating_kwh: number;
        electrical_energy_heating_kwh: number;
      }
    >();

    sourceData.forEach((row) => {
      const heatingId = String(row.heating_id);
      if (!heatingId || heatingId === "null" || heatingId === "undefined") return;

      const existing = systemTotals.get(heatingId) || {
        thermal_energy_kwh: 0,
        electrical_energy_kwh: 0,
        thermal_energy_heating_kwh: 0,
        electrical_energy_heating_kwh: 0,
      };

      // Sum the deltas (treating null as 0, converting to number)
      existing.thermal_energy_kwh += Number(row.thermal_energy_kwh || 0);
      existing.electrical_energy_kwh += Number(row.electrical_energy_kwh || 0);
      existing.thermal_energy_heating_kwh += Number(row.thermal_energy_heating_kwh || 0);
      existing.electrical_energy_heating_kwh += Number(row.electrical_energy_heating_kwh || 0);

      systemTotals.set(heatingId, existing);
    });

    // Convert to array format expected by histogram
    return Array.from(systemTotals.entries()).map(([heating_id, totals]) => ({
      heating_id,
      thermal_energy_kwh: totals.thermal_energy_kwh,
      electrical_energy_kwh: totals.electrical_energy_kwh,
      thermal_energy_heating_kwh: totals.thermal_energy_heating_kwh,
      electrical_energy_heating_kwh: totals.electrical_energy_heating_kwh,
      created_at: null, // Not needed for aggregated data
    }));
  }, [filteredDataForChart, filteredData, sortedData]);

  return (
    <PageLayout
      titleKey="daily.title"
      infoKey="daily.info"
      error={error}
      isLoading={isLoading}
      filters={filterSection}
      chart={
        viewMode === "timeSeries" ? (
          <AzBarChart
            data={
              comparisonMode
                ? []
                : ((realisticDataForChart ||
                    filterRealisticDataForCharts(filteredData, true)) as ChartDataRow[])
            }
            comparisonGroups={realisticComparisonGroups}
            indexField="hour"
            indexLabel="common.hour"
            indexValues={[
              "0",
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "10",
              "11",
              "12",
              "13",
              "14",
              "15",
              "16",
              "17",
              "18",
              "19",
              "20",
              "21",
              "22",
              "23",
            ]}
            aggregateData={true}
            metricMode={metricMode}
          />
        ) : (
          <HistogramChart
            data={histogramDataSource}
            metricMode={metricMode}
            statsTitle={
              metricMode === "energy" ? t("charts.dailyEnergyStats") : t("charts.dailyCopStats")
            }
            binSize={metricMode === "energy" ? 5 : 0.5}
          />
        )
      }
    >
      <DataGridWrapper
        rows={sortedData}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.id as string}
        columnVisibilityModel={commonHiddenColumns}
        onFilterChange={handleFilterChange}
        {...dataGridComparisonProps}
        onDeleteRow={handleDeleteClick}
        deleteDisabled={deleteMutation.isPending}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        title={t("deleteConfirm.deleteMeasurement")}
        message={t("deleteConfirm.deleteMeasurementMessage")}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteMutation.isPending}
        loadingText={t("deleteConfirm.deleting")}
      />
    </PageLayout>
  );
}
