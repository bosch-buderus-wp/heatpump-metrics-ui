import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CategoryBarChart, HeatingSeasonChart } from "../components/common/charts";
import { ChartFullscreenPanel, ChartUtilityFrame, PageLayout } from "../components/common/layout";
import { MonthYearPicker } from "../components/form";
import { useModelFamily } from "../hooks/useModelFamily";
import { useSystemConsumptionRows } from "../hooks/useSystemConsumptionMode";
import {
  createEnergyStandardChartData,
  createEnergyStandardFlowTemperatureData,
  createHeatingSeasonWeekData,
  filterHeatingDemandRows,
} from "../lib/buildingEnergyComparison";
import { supabase } from "../lib/supabaseClient";
import type { Database } from "../types/database.types";

type MonthlyValue = Database["public"]["Views"]["monthly_values_view"]["Row"];
type DailyValue = Database["public"]["Views"]["daily_values_view"]["Row"];
const WINTER_MONTHS = new Set([1, 2, 3, 10, 11, 12]);
const DAILY_VALUES_PAGE_SIZE = 1_500;
const DAILY_VALUES_SELECT =
  "date,heating_id,heated_area_m2,thermal_energy_heating_kwh,building_energy_standard";

async function fetchHeatingSeasonRows(year: number, family: string): Promise<DailyValue[]> {
  const rows: DailyValue[] = [];

  for (let from = 0; ; from += DAILY_VALUES_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("daily_values_view")
      .select(DAILY_VALUES_SELECT)
      .eq("model_family_id", family)
      .gte("date", `${year}-01-01`)
      .lt("date", `${year + 1}-01-01`)
      .order("date", { ascending: true })
      .order("heating_id", { ascending: true })
      .range(from, from + DAILY_VALUES_PAGE_SIZE - 1);

    if (error) throw error;

    const page = data as DailyValue[];
    rows.push(...page);

    if (page.length < DAILY_VALUES_PAGE_SIZE) return rows;
  }
}

export default function BuildingComparison() {
  const { family } = useModelFamily();
  const { t, i18n } = useTranslation();
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(dayjs().year());

  const { data, isLoading, error } = useQuery<MonthlyValue[]>({
    queryKey: ["building-comparison", year, family],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_values_view")
        .select("*")
        .eq("model_family_id", family)
        .eq("year", year);

      if (error) throw error;
      return data as MonthlyValue[];
    },
  });
  const displayData = useSystemConsumptionRows(data, "month");
  const {
    data: heatingSeasonRows,
    isLoading: isHeatingSeasonLoading,
    error: heatingSeasonError,
  } = useQuery<DailyValue[]>({
    queryKey: ["building-comparison-heating-season", year, family],
    queryFn: () => fetchHeatingSeasonRows(year, family),
  });
  const chartData = useMemo(
    () => createEnergyStandardChartData(filterHeatingDemandRows(displayData, year, month), t),
    [displayData, month, t, year],
  );
  const flowTemperatureData = useMemo(
    () =>
      createEnergyStandardFlowTemperatureData(
        displayData?.filter((row) => row.month != null && WINTER_MONTHS.has(row.month)),
        t,
      ),
    [displayData, t],
  );
  const heatingSeasonData = useMemo(
    () => createHeatingSeasonWeekData(heatingSeasonRows, year, t),
    [heatingSeasonRows, year, t],
  );
  const heatingDemandPeriod = useMemo(() => {
    const now = new Date();
    const monthFormatter = new Intl.DateTimeFormat(i18n.language, { month: "long" });

    if (month !== 0) {
      return t("buildingComparison.heatingDemandPeriodMonth", {
        month: monthFormatter.format(new Date(year, month - 1, 1)),
        year,
      });
    }

    const lastCompletedMonth = year === now.getFullYear() ? now.getMonth() : 11;
    if (lastCompletedMonth < 0) return t("buildingComparison.heatingDemandPeriodNone", { year });

    return t("buildingComparison.heatingDemandPeriodAll", {
      month: monthFormatter.format(new Date(year, lastCompletedMonth, 1)),
      year,
    });
  }, [i18n.language, month, t, year]);

  const timePicker = (
    <div className="filter-container">
      <MonthYearPicker
        month={month}
        year={year}
        onChange={({ month: selectedMonth, year: selectedYear }) => {
          setMonth(selectedMonth);
          setYear(selectedYear);
        }}
        allMonthsLabel={t("common.all")}
      />
    </div>
  );

  return (
    <PageLayout
      titleKey="buildingComparison.title"
      infoKey="buildingComparison.info"
      infoAfterChartControls
      error={error ?? heatingSeasonError}
      chartControls={timePicker}
      chart={
        <ChartUtilityFrame isLoading={isLoading} utility={<span>{heatingDemandPeriod}</span>}>
          <CategoryBarChart
            data={chartData}
            valueLabel={t("buildingComparison.heatingDemandPerArea")}
            valueUnit="kWh/m²"
            axisLabel={t("buildingComparison.heatingDemandPerAreaAxis")}
          />
        </ChartUtilityFrame>
      }
    >
      <section className="building-comparison-section">
        <p className="muted">{t("buildingComparison.flowTemperatureInfo")}</p>
        <ChartFullscreenPanel title={t("buildingComparison.flowTemperatureTitle")}>
          <ChartUtilityFrame
            isLoading={isLoading}
            utility={<span>{t("buildingComparison.flowTemperaturePeriod", { year })}</span>}
          >
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
          <ChartUtilityFrame
            isLoading={isHeatingSeasonLoading}
            utility={<span>{t("buildingComparison.heatingSeasonPeriod", { year })}</span>}
          >
            <HeatingSeasonChart data={heatingSeasonData} />
          </ChartUtilityFrame>
        </ChartFullscreenPanel>
      </section>
    </PageLayout>
  );
}
