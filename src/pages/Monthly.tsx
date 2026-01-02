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
import { MonthYearPicker } from "../components/form";
import { useComparisonMode } from "../hooks/useComparisonMode";
import { calculateSystemAz, createHistogramBins } from "../lib/chartDataProcessing";
import { supabase } from "../lib/supabaseClient";
import { commonHiddenColumns, getAllDataGridColumns } from "../lib/tableHelpers";
import type { Database } from "../types/database.types";

type DailyValue = Database["public"]["Views"]["daily_values"]["Row"];
type ViewMode = "timeSeries" | "distribution";

export default function Monthly() {
  const { t } = useTranslation();
  const defaultMonth = Number(dayjs().format("M"));
  const defaultYear = Number(dayjs().format("YYYY"));
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [filteredData, setFilteredData] = useState<DailyValue[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("timeSeries");

  // Wrap setFilteredData in useCallback to prevent infinite loops in DataGridWrapper
  const handleFilterChange = useCallback((data: DailyValue[]) => {
    setFilteredData(data);
  }, []);

  // Define columns specific to Monthly page (daily_values view already has az computed)
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

  const { data, isLoading, error } = useQuery({
    queryKey: ["daily", month, year],
    queryFn: async () => {
      const start = dayjs(`${year}-${month}-01`).startOf("month").format("YYYY-MM-DD");
      const end = dayjs(`${year}-${month}-01`).endOf("month").format("YYYY-MM-DD");

      const { data, error } = await supabase
        .from("daily_values")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as DailyValue[];
    },
  });

  const handleMonthYearChange = useCallback((val: { month: number; year: number }) => {
    setMonth(val.month);
    setYear(val.year);
  }, []);

  // Comparison mode hook - handles all filter logic
  const {
    comparisonMode,
    comparisonGroupsForChart,
    filteredDataForChart,
    dataGridComparisonProps,
  } = useComparisonMode(data);

  // Sort data (not used)
  const sortedData = useMemo(() => {
    if (!data) return [];
    return data;
  }, [data]);

  // Calculate histogram data for distribution view (MAZ - Monthly AZ) (lazy - only when needed)
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

    // Calculate MAZ (monthly AZ) for each system
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
      titleKey="monthly.title"
      infoKey="monthly.info"
      error={error}
      isLoading={isLoading}
      filters={
        <div className="filter-container">
          <MonthYearPicker month={month} year={year} onChange={handleMonthYearChange} />
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
            indexField="date"
            indexLabel="common.date"
            indexFormatter={(date) => dayjs(date).format("DD")}
            aggregateData={true}
          />
        ) : (
          <HistogramChart
            azBins={histogramData?.az.bins || []}
            azHeatingBins={histogramData?.azHeating.bins || []}
            azStats={histogramData?.az.stats || { mean: 0, median: 0 }}
            azHeatingStats={histogramData?.azHeating.stats || { mean: 0, median: 0 }}
            statsTitle={t("charts.monthlyCopStats")}
          />
        )
      }
    >
      <DataGridWrapper
        rows={sortedData}
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
