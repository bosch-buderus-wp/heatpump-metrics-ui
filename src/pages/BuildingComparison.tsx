import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CategoryBarChart, HeatingSeasonChart } from "../components/common/charts";
import { ChartFullscreenPanel, ChartUtilityFrame, PageLayout } from "../components/common/layout";
import { MonthYearPicker } from "../components/form";
import { useSystemConsumptionRows } from "../hooks/useSystemConsumptionMode";
import {
  createEnergyStandardChartData,
  createEnergyStandardFlowTemperatureData,
  createHeatingSeasonData,
} from "../lib/buildingEnergyComparison";
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
  const {
    data: heatingSeasonRows,
    isLoading: isHeatingSeasonLoading,
    error: heatingSeasonError,
  } = useQuery<MonthlyValue[]>({
    queryKey: ["building-comparison-heating-season", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_values_view")
        .select("*")
        .eq("year", year);

      if (error) throw error;
      return data as MonthlyValue[];
    },
  });
  const displayData = useSystemConsumptionRows(data, "month");
  const chartData = useMemo(() => createEnergyStandardChartData(displayData, t), [displayData, t]);
  const flowTemperatureData = useMemo(
    () => createEnergyStandardFlowTemperatureData(displayData, t),
    [displayData, t],
  );
  const heatingSeasonData = useMemo(
    () => createHeatingSeasonData(heatingSeasonRows, t),
    [heatingSeasonRows, t],
  );

  const datePicker = (
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
  );

  return (
    <PageLayout
      titleKey="buildingComparison.title"
      infoKey="buildingComparison.info"
      error={error ?? heatingSeasonError}
      isLoading={isLoading || isHeatingSeasonLoading}
      chartControls={datePicker}
      chart={
        <ChartUtilityFrame>
          <CategoryBarChart
            data={chartData}
            valueLabel={t("buildingComparison.heatingDemandPerArea")}
            valueUnit="kWh/m²"
          />
        </ChartUtilityFrame>
      }
    >
      <section className="building-comparison-section">
        <p className="muted">{t("buildingComparison.flowTemperatureInfo")}</p>
        <ChartFullscreenPanel
          title={t("buildingComparison.flowTemperatureTitle")}
          controls={datePicker}
        >
          <ChartUtilityFrame>
            <CategoryBarChart
              data={flowTemperatureData}
              valueLabel={t("buildingComparison.flowTemperature")}
              valueUnit="°C"
            />
          </ChartUtilityFrame>
        </ChartFullscreenPanel>
      </section>
      <section className="building-comparison-section">
        <p className="muted">{t("buildingComparison.heatingSeasonInfo")}</p>
        <ChartFullscreenPanel title={t("buildingComparison.heatingSeasonTitle")}>
          <ChartUtilityFrame>
            <HeatingSeasonChart data={heatingSeasonData} />
          </ChartUtilityFrame>
        </ChartFullscreenPanel>
      </section>
    </PageLayout>
  );
}
