import { useMemo, useState, useCallback } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button, ButtonGroup } from "@mui/material";
import TimelineIcon from "@mui/icons-material/Timeline";
import BarChartIcon from "@mui/icons-material/BarChart";
import { supabase } from "../lib/supabaseClient";
import type { Database } from "../types/database.types";
import { AzBarChart, type ChartDataRow, HistogramChart } from "../components/common/charts";
import { PageLayout } from "../components/common/layout";
import { DataGridWrapper } from "../components/common/data-grid";
import { getAllDataGridColumns, commonHiddenColumns } from "../lib/tableHelpers";
import { useComparisonMode } from "../hooks/useComparisonMode";
import { flattenHeatingSystemsFields } from "../lib/dataTransformers";
import { calculateDailyTaz, createHistogramBins } from "../lib/chartDataProcessing";

type MeasurementRow = Database["public"]["Tables"]["measurements"]["Row"];
type ViewMode = "timeSeries" | "distribution";

export default function Daily() {
  const { t } = useTranslation();
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [filteredData, setFilteredData] = useState<MeasurementRow[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("timeSeries");

  // Wrap setFilteredData in useCallback to prevent infinite loops in DataGridWrapper
  const handleFilterChange = useCallback((data: MeasurementRow[]) => {
    setFilteredData(data);
  }, []);

  // Define columns specific to Daily page
  const columns = useMemo(() => {
    const cols = getAllDataGridColumns(t);
    return [
      cols.user_id,
      cols.time,
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
        } else {
          // First measurement has no previous data
          enriched.az = undefined;
          enriched.az_heating = undefined;
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

  // Calculate histogram data for distribution view (Daily AZ) (lazy - only when needed)
  const histogramData = useMemo(() => {
    // Only calculate if we're in distribution mode
    if (viewMode !== "distribution") return null;
    if (!sortedData) return null;

    // Use filtered data if available, otherwise use all data
    const dataToUse = (filteredDataForChart || filteredData || sortedData) as Array<{
      heating_id: string;
      thermal_energy_kwh?: number | null;
      electrical_energy_kwh?: number | null;
      thermal_energy_heating_kwh?: number | null;
      electrical_energy_heating_kwh?: number | null;
    }>;

    // Calculate TAZ (daily AZ) for each system using difference between first and last measurement
    const systemAzData = calculateDailyTaz(dataToUse);

    // Create histogram bins for total AZ
    const azHistogram = createHistogramBins(systemAzData, "az", 0.5);

    // Create histogram bins for heating AZ
    const azHeatingHistogram = createHistogramBins(systemAzData, "azHeating", 0.5);

    return {
      az: azHistogram,
      azHeating: azHeatingHistogram,
    };
  }, [viewMode, sortedData, filteredData, filteredDataForChart]);

  return (
    <PageLayout
      titleKey="daily.title"
      infoKey="daily.info"
      error={error}
      isLoading={isLoading}
      filters={
        <div className="filter-container">
          <div className="row picker">
            <label htmlFor="daily-date-picker">{t("common.date")}</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
        </div>
      }
      chart={
        viewMode === "timeSeries" ? (
          <AzBarChart
            data={comparisonMode ? [] : ((filteredDataForChart || filteredData) as ChartDataRow[])}
            comparisonGroups={comparisonGroupsForChart}
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
          />
        ) : (
          <HistogramChart
            azBins={histogramData?.az.bins || []}
            azHeatingBins={histogramData?.azHeating.bins || []}
            azStats={histogramData?.az.stats || { mean: 0, median: 0 }}
            azHeatingStats={histogramData?.azHeating.stats || { mean: 0, median: 0 }}
            statsTitle={t("charts.dailyCopStats")}
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
