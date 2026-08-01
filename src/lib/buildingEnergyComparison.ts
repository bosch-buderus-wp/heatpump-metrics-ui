import type { CategoryBarChartRow } from "../components/common/charts";
import type { Database } from "../types/database.types";

export type BuildingEnergyComparisonRow = Pick<
  Database["public"]["Views"]["monthly_values_view"]["Row"],
  "building_energy_standard" | "heated_area_m2" | "heating_id" | "thermal_energy_heating_kwh"
>;

type HeatingDemandFilterRow = BuildingEnergyComparisonRow &
  Pick<
    Database["public"]["Views"]["monthly_values_view"]["Row"],
    "is_manual_override" | "last_auto_calculated_at" | "month"
  >;

type BuildingFlowTemperatureRow = Pick<
  Database["public"]["Views"]["monthly_values_view"]["Row"],
  "building_energy_standard" | "flow_temperature_c" | "heating_id"
>;

type BuildingHeatingSeasonWeekRow = Pick<
  Database["public"]["Views"]["daily_values_view"]["Row"],
  | "building_energy_standard"
  | "date"
  | "heated_area_m2"
  | "heating_id"
  | "thermal_energy_heating_kwh"
>;

export const HEATING_WEEK_ENERGY_THRESHOLD_KWH_PER_M2_DAY = 0.1;
export const HEATING_SEASON_ACTIVE_SHARE_THRESHOLD = 0.5;

export interface HeatingSeasonWeekDataRow {
  category: string;
  weeks: {
    startDate: string;
    endDate: string;
    month: number;
    active: boolean;
    activeShare: number;
    sampleSize: number;
  }[];
}

export function filterHeatingDemandRows(
  rows: HeatingDemandFilterRow[] | undefined,
  selectedYear: number,
  selectedMonth: number,
  now = new Date(),
): HeatingDemandFilterRow[] {
  const isCurrentYear = selectedYear === now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return (rows ?? []).filter((row) => {
    if (row.month == null || (selectedMonth !== 0 && row.month !== selectedMonth)) return false;

    if (selectedMonth === 0 && isCurrentYear && row.month >= currentMonth) return false;

    return row.is_manual_override === true || row.last_auto_calculated_at != null;
  });
}

function getEnergyStandardCategory(
  row: Pick<BuildingEnergyComparisonRow, "building_energy_standard">,
  translate: (key: string) => string,
) {
  if (!row.building_energy_standard || row.building_energy_standard === "unknown") {
    return translate("buildingComparison.unknown");
  }

  return translate(`models.building_energy_standard.${row.building_energy_standard}`);
}

export function createEnergyStandardChartData(
  rows: BuildingEnergyComparisonRow[] | undefined,
  translate: (key: string) => string,
): CategoryBarChartRow[] {
  const systemsByCategory = new Map<
    string,
    Map<string, { heatedArea: number; thermalEnergy: number }>
  >();

  for (const row of rows ?? []) {
    if (!row.heating_id || !row.heated_area_m2 || row.heated_area_m2 <= 0) continue;
    if (!row.thermal_energy_heating_kwh || row.thermal_energy_heating_kwh <= 0) continue;

    const category = getEnergyStandardCategory(row, translate);

    const systems = systemsByCategory.get(category) ?? new Map();
    const system = systems.get(row.heating_id) ?? {
      heatedArea: row.heated_area_m2,
      thermalEnergy: 0,
    };
    system.thermalEnergy += row.thermal_energy_heating_kwh;
    systems.set(row.heating_id, system);
    systemsByCategory.set(category, systems);
  }

  return [...systemsByCategory.entries()]
    .map(([category, systems]) => {
      const values = [...systems.values()].map(
        (system) => system.thermalEnergy / system.heatedArea,
      );
      return {
        category,
        value: values.reduce((sum, value) => sum + value, 0) / values.length,
        sampleSize: values.length,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function createEnergyStandardFlowTemperatureData(
  rows: BuildingFlowTemperatureRow[] | undefined,
  translate: (key: string) => string,
): CategoryBarChartRow[] {
  const systemsByCategory = new Map<string, Map<string, { total: number; count: number }>>();

  for (const row of rows ?? []) {
    if (!row.heating_id || row.flow_temperature_c == null) continue;
    if (row.flow_temperature_c < 15 || row.flow_temperature_c > 80) continue;

    const category = getEnergyStandardCategory(row, translate);
    const systems = systemsByCategory.get(category) ?? new Map();
    const system = systems.get(row.heating_id) ?? { total: 0, count: 0 };
    system.total += row.flow_temperature_c;
    system.count += 1;
    systems.set(row.heating_id, system);
    systemsByCategory.set(category, systems);
  }

  return [...systemsByCategory.entries()]
    .map(([category, systems]) => {
      const values = [...systems.values()].map((system) => system.total / system.count);
      return {
        category,
        value: values.reduce((sum, value) => sum + value, 0) / values.length,
        sampleSize: values.length,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function createHeatingSeasonWeekData(
  rows: BuildingHeatingSeasonWeekRow[] | undefined,
  year: number,
  translate: (key: string) => string,
): HeatingSeasonWeekDataRow[] {
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const startOfNextYear = new Date(Date.UTC(year + 1, 0, 1));
  const weekCount = Math.ceil((startOfNextYear.getTime() - startOfYear.getTime()) / 86_400_000 / 7);
  const systemsByCategoryAndWeek = new Map<
    string,
    Map<number, Map<string, { heatedArea: number; thermalEnergy: number; observedDays: number }>>
  >();

  for (const row of rows ?? []) {
    if (!row.heating_id || !row.heated_area_m2 || row.heated_area_m2 <= 0) continue;
    if (row.thermal_energy_heating_kwh == null || row.thermal_energy_heating_kwh < 0) continue;
    if (!row.date) continue;

    const date = new Date(`${row.date}T00:00:00Z`);
    const weekIndex = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000 / 7);
    if (Number.isNaN(date.getTime()) || weekIndex < 0 || weekIndex >= weekCount) continue;

    const category = getEnergyStandardCategory(row, translate);
    const weeks = systemsByCategoryAndWeek.get(category) ?? new Map();
    const systems = weeks.get(weekIndex) ?? new Map();
    const system = systems.get(row.heating_id) ?? {
      heatedArea: row.heated_area_m2,
      thermalEnergy: 0,
      observedDays: 0,
    };
    system.thermalEnergy += row.thermal_energy_heating_kwh;
    system.observedDays += 1;
    systems.set(row.heating_id, system);
    weeks.set(weekIndex, systems);
    systemsByCategoryAndWeek.set(category, weeks);
  }

  return [...systemsByCategoryAndWeek.entries()]
    .map(([category, weeks]) => ({
      category,
      weeks: Array.from({ length: weekCount }, (_, index) => {
        const weekStart = new Date(startOfYear.getTime() + index * 7 * 86_400_000);
        const weekEnd = new Date(
          Math.min(weekStart.getTime() + 6 * 86_400_000, startOfNextYear.getTime() - 86_400_000),
        );
        const systems = weeks.get(index);
        const values = systems
          ? [...systems.values()].filter(
              (system) => system.observedDays >= Math.min(3, index === weekCount - 1 ? 1 : 3),
            )
          : [];
        const activeSystems = values.filter(
          (system) =>
            system.thermalEnergy / system.heatedArea / system.observedDays >=
            HEATING_WEEK_ENERGY_THRESHOLD_KWH_PER_M2_DAY - Number.EPSILON,
        ).length;
        const activeShare = values.length > 0 ? activeSystems / values.length : 0;

        return {
          startDate: weekStart.toISOString().slice(0, 10),
          endDate: weekEnd.toISOString().slice(0, 10),
          month: weekStart.getUTCMonth() + 1,
          active: activeShare >= HEATING_SEASON_ACTIVE_SHARE_THRESHOLD,
          activeShare,
          sampleSize: values.length,
        };
      }),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}
