import type { CategoryBarChartRow } from "../components/common/charts";
import type { Database } from "../types/database.types";

export type BuildingEnergyComparisonRow = Pick<
  Database["public"]["Views"]["monthly_values_view"]["Row"],
  "building_energy_standard" | "heated_area_m2" | "heating_id" | "thermal_energy_heating_kwh"
>;

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

    const category = row.building_energy_standard
      ? row.building_energy_standard === "unknown"
        ? translate("buildingComparison.unknown")
        : translate(`models.building_energy_standard.${row.building_energy_standard}`)
      : translate("buildingComparison.unknown");

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
