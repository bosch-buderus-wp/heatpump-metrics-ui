import type { CategoryBarChartRow } from "../components/common/charts";
import type { Database } from "../types/database.types";

export type BuildingEnergyComparisonRow = Pick<
  Database["public"]["Views"]["monthly_values_view"]["Row"],
  "building_energy_standard" | "heated_area_m2" | "heating_id" | "thermal_energy_heating_kwh"
>;

type BuildingFlowTemperatureRow = Pick<
  Database["public"]["Views"]["monthly_values_view"]["Row"],
  "building_energy_standard" | "flow_temperature_c" | "heating_id"
>;

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
