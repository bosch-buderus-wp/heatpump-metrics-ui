import { useMemo, useState, useCallback } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { Database } from "../types/database.types";
import { AzBarChart, type ChartDataRow } from "../components/common/charts";
import { PageLayout } from "../components/common/layout";
import { DataGridWrapper } from "../components/common/data-grid";
import { getAllDataGridColumns, commonHiddenColumns } from "../lib/tableHelpers";
import { MonthYearPicker } from "../components/form";
import { useComparisonMode } from "../hooks/useComparisonMode";

type DailyValue = Database["public"]["Views"]["daily_values"]["Row"];

export default function Monthly() {
  const { t } = useTranslation();
  const defaultMonth = Number(dayjs().format("M"));
  const defaultYear = Number(dayjs().format("YYYY"));
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [filteredData, setFilteredData] = useState<DailyValue[]>([]);

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

  return (
    <PageLayout
      titleKey="monthly.title"
      infoKey="monthly.info"
      error={error}
      isLoading={isLoading}
      filters={<MonthYearPicker month={month} year={year} onChange={handleMonthYearChange} />}
      chart={
        <AzBarChart
          data={comparisonMode ? [] : ((filteredDataForChart || filteredData) as ChartDataRow[])}
          comparisonGroups={comparisonGroupsForChart}
          indexField="date"
          indexLabel="common.date"
          indexFormatter={(date) => dayjs(date).format("DD")}
          aggregateData={true}
        />
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
