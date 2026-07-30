import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CategoryBarChart } from "../components/common/charts";
import { ChartUtilityFrame, PageLayout } from "../components/common/layout";
import { MonthYearPicker } from "../components/form";
import { useSystemConsumptionRows } from "../hooks/useSystemConsumptionMode";
import { createEnergyStandardChartData } from "../lib/buildingEnergyComparison";
import { supabase } from "../lib/supabaseClient";
import type { Database } from "../types/database.types";

type MonthlyValue = Database["public"]["Views"]["monthly_values_view"]["Row"];

export default function BuildingComparison() {
  const { t } = useTranslation();
  const defaultDate = dayjs().subtract(5, "month");
  const [month, setMonth] = useState(defaultDate.month() + 1);
  const [year, setYear] = useState(defaultDate.year());

  const { data, isLoading, error } = useQuery<MonthlyValue[]>({
    queryKey: ["building-comparison", year, month],
    queryFn: async () => {
      let query = supabase.from("monthly_values_view").select("*").eq("year", year);
      if (month > 0) query = query.eq("month", month);
      const { data, error } = await query;

      if (error) throw error;
      return data as MonthlyValue[];
    },
  });
  const displayData = useSystemConsumptionRows(data, "month");
  const chartData = useMemo(() => createEnergyStandardChartData(displayData, t), [displayData, t]);

  return (
    <PageLayout
      titleKey="buildingComparison.title"
      infoKey="buildingComparison.info"
      error={error}
      isLoading={isLoading}
      chartControls={
        <div className="filter-container">
          <MonthYearPicker
            month={month}
            year={year}
            allMonthsLabel={t("common.all")}
            onChange={({ month, year }) => {
              setMonth(month);
              setYear(year);
            }}
          />
        </div>
      }
      chart={
        <ChartUtilityFrame>
          <CategoryBarChart
            data={chartData}
            valueLabel={t("buildingComparison.heatingDemandPerArea")}
          />
        </ChartUtilityFrame>
      }
    >
      {null}
    </PageLayout>
  );
}
