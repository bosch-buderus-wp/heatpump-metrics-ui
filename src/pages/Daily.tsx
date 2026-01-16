import BarChartIcon from "@mui/icons-material/BarChart";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import SpeedIcon from "@mui/icons-material/Speed";
import TimelineIcon from "@mui/icons-material/Timeline";
import { Button, ButtonGroup } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AzBarChart, type ChartDataRow, HistogramChart } from "../components/common/charts";
import { DataGridWrapper } from "../components/common/data-grid";
import { PageLayout } from "../components/common/layout";
import { useComparisonMode } from "../hooks/useComparisonMode";
import { filterRealisticDataForCharts } from "../lib/dataQuality";
import { applyThermometerOffset, flattenHeatingSystemsFields } from "../lib/dataTransformers";
import { supabase } from "../lib/supabaseClient";
import { commonHiddenColumns, getTimeSeriesColumns } from "../lib/tableHelpers";
import type { Database } from "../types/database.types";

type MeasurementRow = Database["public"]["Tables"]["measurements"]["Row"] & {
  heating_systems: Database["public"]["Tables"]["heating_systems"]["Row"] | null;
};
type ViewMode = "timeSeries" | "distribution";
type MetricMode = "cop" | "energy";

export default function Daily() {
  const { t } = useTranslation();
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [filteredData, setFilteredData] = useState<MeasurementRow[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("timeSeries");
  const [metricMode, setMetricMode] = useState<MetricMode>("cop");

  // Wrap setFilteredData in useCallback to prevent infinite loops in DataGridWrapper
  const handleFilterChange = useCallback((data: MeasurementRow[]) => {
    setFilteredData(data);
  }, []);

  // Define columns for Daily page
  const columns = useMemo(() => getTimeSeriesColumns(t, "time"), [t]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["measurements", date],
    queryFn: async () => {
      const start = dayjs(date).startOf("day").toISOString();
      const end = dayjs(date).endOf("day").toISOString();
      const { data, error } = await supabase
        .from("measurements")
        .select("*, heating_systems(*)")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Sort data
  // Calculate AZ from differences for each measurement
  const sortedData = useMemo(() => {
    if (!data) return [];

    // Group by heating_id and sort by time
    const grouped: Record<string, MeasurementRow[]> = {};
    for (const row of data) {
      const heatingId = row.heating_id;
      if (!grouped[heatingId]) {
        grouped[heatingId] = [];
      }
      grouped[heatingId].push(row);
    }

    // Calculate AZ for each row based on difference from previous measurement
    const enrichedData: Array<
      MeasurementRow & { az?: number; az_heating?: number; hour?: string }
    > = [];

    for (const heatingId of Object.keys(grouped)) {
      const measurements = grouped[heatingId].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      for (let i = 0; i < measurements.length; i++) {
        const current = measurements[i];
        const enriched: MeasurementRow & { az?: number; az_heating?: number; hour?: string } = {
          ...current,
        };

        // Apply thermometer offset correction to outdoor temperature
        const offset = current.heating_systems?.thermometer_offset_k;
        if (offset !== null && offset !== undefined) {
          enriched.outdoor_temperature_c = applyThermometerOffset(
            current.outdoor_temperature_c,
            offset,
          );
        }

        // Add hour field for chart grouping
        enriched.hour = dayjs(current.created_at).hour().toString();

        if (i > 0) {
          const previous = measurements[i - 1];

          // Calculate differences
          const deltaETotal =
            (current.electrical_energy_kwh || 0) - (previous.electrical_energy_kwh || 0);
          const deltaTTotal =
            (current.thermal_energy_kwh || 0) - (previous.thermal_energy_kwh || 0);
          const deltaEHeating =
            (current.electrical_energy_heating_kwh || 0) -
            (previous.electrical_energy_heating_kwh || 0);
          const deltaTHeating =
            (current.thermal_energy_heating_kwh || 0) - (previous.thermal_energy_heating_kwh || 0);

          // Calculate AZ from differences
          enriched.az = deltaETotal > 0 ? deltaTTotal / deltaETotal : undefined;
          enriched.az_heating = deltaEHeating > 0 ? deltaTHeating / deltaEHeating : undefined;

          // Replace cumulative energy values with deltas for display
          enriched.electrical_energy_kwh = deltaETotal > 0 ? deltaETotal : null;
          enriched.thermal_energy_kwh = deltaTTotal > 0 ? deltaTTotal : null;
          enriched.electrical_energy_heating_kwh = deltaEHeating > 0 ? deltaEHeating : null;
          enriched.thermal_energy_heating_kwh = deltaTHeating > 0 ? deltaTHeating : null;
        } else {
          // First measurement has no previous data
          enriched.az = undefined;
          enriched.az_heating = undefined;
          enriched.electrical_energy_kwh = null;
          enriched.thermal_energy_kwh = null;
          enriched.electrical_energy_heating_kwh = null;
          enriched.thermal_energy_heating_kwh = null;
        }

        // Flatten heating_systems fields to top level for filtering
        const flattenedEnriched = flattenHeatingSystemsFields(enriched);
        enrichedData.push(flattenedEnriched);
      }
    }

    // Sort by date descending (newest first) for display
    return enrichedData.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
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
  // For histogram, we need the original cumulative values, not the deltas
  // But we still need to respect filtering from comparison mode or data grid filters
  const histogramDataSource = useMemo(() => {
    // Determine which filtered data to use
    const sourceData = filteredDataForChart || filteredData || sortedData;

    // Get unique heating_ids from the filtered/enriched data
    const filteredHeatingIds = new Set(
      sourceData.map((row) => (row as { heating_id: string }).heating_id),
    );

    // Filter the original raw data to only include those systems
    // This ensures we use cumulative values (not deltas) but respect filtering
    return (data || []).filter((row) => filteredHeatingIds.has(row.heating_id)) as Array<{
      heating_id: string;
      thermal_energy_kwh?: number | null;
      electrical_energy_kwh?: number | null;
      thermal_energy_heating_kwh?: number | null;
      electrical_energy_heating_kwh?: number | null;
      created_at?: string | null;
    }>;
  }, [data, filteredDataForChart, filteredData, sortedData]);

  return (
    <PageLayout
      titleKey="daily.title"
      infoKey="daily.info"
      error={error}
      isLoading={isLoading}
      filters={
        <div className="filter-container">
          <div className="flex-row-gap">
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
          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => setViewMode("timeSeries")}
              variant={viewMode === "timeSeries" ? "contained" : "outlined"}
              startIcon={<TimelineIcon />}
            >
              {t("charts.timeSeries")}
            </Button>
            <Button
              onClick={() => setViewMode("distribution")}
              variant={viewMode === "distribution" ? "contained" : "outlined"}
              startIcon={<BarChartIcon />}
            >
              {t("charts.distribution")}
            </Button>
          </ButtonGroup>
          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => setMetricMode("cop")}
              variant={metricMode === "cop" ? "contained" : "outlined"}
              startIcon={<SpeedIcon />}
            >
              {t("charts.copMode")}
            </Button>
            <Button
              onClick={() => setMetricMode("energy")}
              variant={metricMode === "energy" ? "contained" : "outlined"}
              startIcon={<ElectricBoltIcon />}
            >
              {t("charts.energyMode")}
            </Button>
          </ButtonGroup>
        </div>
      }
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
            useDailyTaz={true}
          />
        )
      }
    >
      <DataGridWrapper
        rows={sortedData}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.id}
        columnVisibilityModel={commonHiddenColumns}
        onFilterChange={handleFilterChange}
        {...dataGridComparisonProps}
      />
    </PageLayout>
  );
}
