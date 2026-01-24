import { Checkbox, FormControlLabel } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AzBarChart, type ChartDataRow, HistogramChart } from "../components/common/charts";
import { DataGridWrapper } from "../components/common/data-grid";
import { PageLayout } from "../components/common/layout";
import { MetricModeToggle, ViewModeToggle } from "../components/ui";
import { useComparisonMode } from "../hooks/useComparisonMode";
import { supabase } from "../lib/supabaseClient";
import { commonHiddenColumns, getTimeSeriesColumns } from "../lib/tableHelpers";
import type { Database } from "../types/database.types";

type MonthlyValueViewRow = Database["public"]["Views"]["monthly_values_view"]["Row"];
type ViewMode = "timeSeries" | "distribution";
type MetricMode = "cop" | "energy";

export default function Yearly() {
  const { t } = useTranslation();
  const defaultYear = Number(dayjs().subtract(1, "month").format("YYYY"));
  const [year, setYear] = useState(defaultYear);
  const [filteredData, setFilteredData] = useState<MonthlyValueViewRow[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("timeSeries");
  const [metricMode, setMetricMode] = useState<MetricMode>("cop");
  const [completeDataOnly, setCompleteDataOnly] = useState(true);

  // Wrap setFilteredData in useCallback to prevent infinite loops in DataGridWrapper
  const handleFilterChange = useCallback((data: MonthlyValueViewRow[]) => {
    setFilteredData(data);
  }, []);

  // Reset completeDataOnly when switching views
  // - Enable when switching to distribution mode (HistogramChart)
  // - Disable when switching to timeSeries mode (AzBarChart)
  useEffect(() => {
    if (viewMode === "timeSeries") {
      setCompleteDataOnly(false);
    } else if (viewMode === "distribution") {
      setCompleteDataOnly(true);
    }
  }, [viewMode]);

  // Define columns for Yearly page
  const columns = useMemo(() => getTimeSeriesColumns(t, "month"), [t]);

  const { data, isLoading, error } = useQuery<MonthlyValueViewRow[]>({
    queryKey: ["yearly", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_values_view")
        .select("*")
        .eq("year", year);

      if (error) throw error;
      return data as MonthlyValueViewRow[];
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
    if (!data) return data;
    if (!completeDataOnly) return data;

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

    const filtered = data.filter((row) => row.heating_id && completeSystemIds.has(row.heating_id));

    // Return original data if filter didn't remove anything to maintain reference stability
    return filtered.length === data.length ? data : filtered;
  }, [data, completeDataOnly, expectedMonths]);

  // Memoize filter section to prevent unnecessary re-renders
  const filterSection = useMemo(
    () => (
      <div className="filter-container">
        <div className="flex-center-gap-sm">
          <select
            id="yearly-year-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="form-select page-filter-select-year"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {viewMode === "distribution" && (
            <FormControlLabel
              className="page-complete-data-checkbox"
              control={
                <Checkbox
                  checked={completeDataOnly}
                  onChange={(e) => setCompleteDataOnly(e.target.checked)}
                />
              }
              label={t("charts.completeDataOnly")}
            />
          )}
        </div>
        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
        <MetricModeToggle metricMode={metricMode} onChange={setMetricMode} />
      </div>
    ),
    [year, years, viewMode, metricMode, completeDataOnly, t],
  );

  // Comparison mode hook - handles all filter logic
  const {
    comparisonMode,
    comparisonGroupsForChart,
    filteredDataForChart,
    dataGridComparisonProps,
  } = useComparisonMode(completeDataFilteredData);

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
      filters={filterSection}
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
        rows={completeDataFilteredData || []}
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
