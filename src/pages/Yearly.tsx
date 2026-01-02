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
import { calculateSystemAz, createHistogramBins } from "../lib/chartDataProcessing";
import { flattenHeatingSystemsFields } from "../lib/dataTransformers";
import { supabase } from "../lib/supabaseClient";
import { commonHiddenColumns, computeAz, getAllDataGridColumns } from "../lib/tableHelpers";

type ViewMode = "timeSeries" | "distribution";

export default function Yearly() {
  const { t } = useTranslation();
  const defaultYear = Number(dayjs().subtract(1, "month").format("YYYY"));
  const [year, setYear] = useState(defaultYear);
  const [filteredData, setFilteredData] = useState<Array<Record<string, unknown>>>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("timeSeries");

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

  // Calculate AZ values from energy data and prepare for display
  const sortedData = useMemo(() => {
    if (!data) return [];

    // Add calculated AZ values to each row using the shared computeAz function
    // Also flatten heating_systems fields to top level for filtering
    return data.map((row) => {
      const { az, azHeating } = computeAz(row);
      return flattenHeatingSystemsFields({
        ...row,
        az,
        az_heating: azHeating,
      });
    });
  }, [data]);

  // Comparison mode hook - handles all filter logic
  const {
    comparisonMode,
    comparisonGroupsForChart,
    filteredDataForChart,
    dataGridComparisonProps,
  } = useComparisonMode(sortedData);

  // Calculate histogram data for distribution view (JAZ - Yearly AZ) (lazy - only when needed)
  const histogramData = useMemo(() => {
    // Only calculate if we're in distribution mode
    if (viewMode !== "distribution") return null;
    if (!data) return null;

    // Use filtered data if available, otherwise use all data
    const dataToUse = (filteredDataForChart || filteredData || data) as Array<{
      heating_id: string;
      thermal_energy_kwh?: number | null;
      electrical_energy_kwh?: number | null;
      thermal_energy_heating_kwh?: number | null;
      electrical_energy_heating_kwh?: number | null;
    }>;

    // Calculate JAZ (yearly AZ) for each system
    const systemAzData = calculateSystemAz(dataToUse);

    // Create histogram bins for total AZ
    const azHistogram = createHistogramBins(systemAzData, "az", 0.5);

    // Create histogram bins for heating AZ
    const azHeatingHistogram = createHistogramBins(systemAzData, "azHeating", 0.5);

    return {
      az: azHistogram,
      azHeating: azHeatingHistogram,
    };
  }, [viewMode, data, filteredData, filteredDataForChart]);

  return (
    <PageLayout
      titleKey="yearly.title"
      infoKey="yearly.info"
      error={error}
      isLoading={isLoading}
      filters={
        <div className="filter-container">
          <div className="row picker">
            <label htmlFor="yearly-year-select">{t("common.year")}</label>
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
            indexField="month"
            indexLabel="common.month"
            indexValues={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]}
            aggregateData={true}
          />
        ) : (
          <HistogramChart
            azBins={histogramData?.az.bins || []}
            azHeatingBins={histogramData?.azHeating.bins || []}
            azStats={histogramData?.az.stats || { mean: 0, median: 0 }}
            azHeatingStats={histogramData?.azHeating.stats || { mean: 0, median: 0 }}
            statsTitle={t("charts.yearlyCopStats")}
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
