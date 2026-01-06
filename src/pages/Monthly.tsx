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
import { supabase } from "../lib/supabaseClient";
import { commonHiddenColumns, getAllDataGridColumns } from "../lib/tableHelpers";
import type { Database } from "../types/database.types";

type DailyValue = Database["public"]["Views"]["daily_values"]["Row"];
type ViewMode = "timeSeries" | "distribution";
type MetricMode = "cop" | "energy";

export default function Monthly() {
  const { t } = useTranslation();
  const defaultMonth = Number(dayjs().format("M"));
  const defaultYear = Number(dayjs().format("YYYY"));
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [filteredData, setFilteredData] = useState<DailyValue[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("timeSeries");
  const [metricMode, setMetricMode] = useState<MetricMode>("cop");

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
      cols.thermalEnergy,
      cols.electricalEnergy,
      cols.thermalEnergyHeating,
      cols.electricalEnergyHeating,
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
            indexField="date"
            indexLabel="common.date"
            indexFormatter={(date) => dayjs(date).format("DD")}
            aggregateData={true}
            metricMode={metricMode}
          />
        ) : (
          <HistogramChart
            data={histogramDataSource}
            metricMode={metricMode}
            statsTitle={
              metricMode === "energy" ? t("charts.monthlyEnergyStats") : t("charts.monthlyCopStats")
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
        getRowId={(row) => `${row.heating_id}-${row.date}`}
        columnVisibilityModel={commonHiddenColumns}
        onFilterChange={handleFilterChange}
        {...dataGridComparisonProps}
      />
    </PageLayout>
  );
}
