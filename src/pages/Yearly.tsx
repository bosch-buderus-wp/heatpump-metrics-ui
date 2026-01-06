import BarChartIcon from "@mui/icons-material/BarChart";
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
import { flattenHeatingSystemsFields } from "../lib/dataTransformers";
import { supabase } from "../lib/supabaseClient";
import { commonHiddenColumns, computeAz, getAllDataGridColumns } from "../lib/tableHelpers";

type ViewMode = "timeSeries" | "distribution";
type MetricMode = "cop" | "energy";

export default function Yearly() {
  const { t } = useTranslation();
  const defaultYear = Number(dayjs().subtract(1, "month").format("YYYY"));
  const [year, setYear] = useState(defaultYear);
  const [filteredData, setFilteredData] = useState<Array<Record<string, unknown>>>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("timeSeries");
  const [metricMode, setMetricMode] = useState<MetricMode>("cop");
  const [completeDataOnly, setCompleteDataOnly] = useState(true);

  // Wrap setFilteredData in useCallback to prevent infinite loops in DataGridWrapper
  const handleFilterChange = useCallback((data: Array<Record<string, unknown>>) => {
    setFilteredData(data);
  }, []);

  // Define columns specific to Yearly page (az will be computed from monthly_values)
  const columns = useMemo(() => {
    const cols = getAllDataGridColumns(t);
    return [
      cols.user_id,
      cols.month,
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
      cols.thermalEnergy,
      cols.electricalEnergy,
      cols.thermalEnergyHeating,
      cols.electricalEnergyHeating,
      cols.outdoorTemperature,
      cols.flowTemperature,
    ];
  }, [t]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["yearly", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_values")
        .select("*, heating_systems(*)")
        .eq("year", year);

      if (error) throw error;
      return data;
    },
  });

  const years = useMemo(() => {
    const y = [];
    for (let yy = 2025; yy <= 2050; yy++) y.push(yy);
    return y;
  }, []);

  // Determine expected months based on selected year
  const expectedMonths = useMemo(() => {
    const currentYear = dayjs().year();
    const currentMonth = dayjs().month() + 1; // 1-12

    if (year < currentYear) {
      // Past year: expect all 12 months
      return 12;
    }
    if (year === currentYear) {
      // Current year: expect Jan to current month
      return currentMonth;
    }
    // Future year: expect 0 months
    return 0;
  }, [year]);

  // Filter data to only include systems with complete data
  const completeDataFilteredData = useMemo(() => {
    if (!data || !completeDataOnly) return data;

    // Count months per system
    const systemMonthCounts = new Map<string, Set<number>>();

    for (const row of data) {
      const heatingId = row.heating_id;
      const month = row.month;

      if (!heatingId || !month) continue;

      if (!systemMonthCounts.has(heatingId)) {
        systemMonthCounts.set(heatingId, new Set());
      }
      systemMonthCounts.get(heatingId)?.add(Number(month));
    }

    // Filter to only include systems with expected number of months
    const completeSystemIds = new Set<string>();
    systemMonthCounts.forEach((months, heatingId) => {
      if (months.size >= expectedMonths) {
        completeSystemIds.add(heatingId);
      }
    });

    return data.filter((row) => completeSystemIds.has(row.heating_id));
  }, [data, completeDataOnly, expectedMonths]);

  // Calculate AZ values from energy data and prepare for display
  const sortedData = useMemo(() => {
    if (!completeDataFilteredData) return [];

    // Add calculated AZ values to each row using the shared computeAz function
    // Also flatten heating_systems fields to top level for filtering
    return completeDataFilteredData.map((row) => {
      const { az, azHeating } = computeAz(row);
      return flattenHeatingSystemsFields({
        ...row,
        az,
        az_heating: azHeating,
      });
    });
  }, [completeDataFilteredData]);

  // Comparison mode hook - handles all filter logic
  const {
    comparisonMode,
    comparisonGroupsForChart,
    filteredDataForChart,
    dataGridComparisonProps,
  } = useComparisonMode(sortedData);

  // Get the data to use for histogram (filtered if available)
  const histogramDataSource = useMemo(() => {
    return (filteredDataForChart || filteredData || data) as Array<{
      heating_id: string;
      thermal_energy_kwh?: number | null;
      electrical_energy_kwh?: number | null;
      thermal_energy_heating_kwh?: number | null;
      electrical_energy_heating_kwh?: number | null;
    }>;
  }, [data, filteredData, filteredDataForChart]);

  return (
    <PageLayout
      titleKey="yearly.title"
      infoKey="yearly.info"
      error={error}
      isLoading={isLoading}
      filters={
        <div className="filter-container">
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <select
              id="yearly-year-select"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="form-select"
              style={{ minWidth: "100px" }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {viewMode === "distribution" && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <input
                  type="checkbox"
                  checked={completeDataOnly}
                  onChange={(e) => setCompleteDataOnly(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                {t("charts.completeDataOnly")}
              </label>
            )}
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
            >
              {t("charts.copMode")}
            </Button>
            <Button
              onClick={() => setMetricMode("energy")}
              variant={metricMode === "energy" ? "contained" : "outlined"}
            >
              {t("charts.energyMode")}
            </Button>
          </ButtonGroup>
        </div>
      }
      chart={
        viewMode === "timeSeries" ? (
          <AzBarChart
            data={comparisonMode ? [] : ((filteredDataForChart || filteredData) as ChartDataRow[])}
            comparisonGroups={comparisonGroupsForChart}
            indexField="month"
            indexLabel="common.month"
            indexValues={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]}
            aggregateData={true}
            metricMode={metricMode}
          />
        ) : (
          <HistogramChart
            data={histogramDataSource}
            metricMode={metricMode}
            statsTitle={
              metricMode === "energy" ? t("charts.yearlyEnergyStats") : t("charts.yearlyCopStats")
            }
            binSize={0.5}
          />
        )
      }
    >
      <DataGridWrapper
        rows={sortedData}
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
