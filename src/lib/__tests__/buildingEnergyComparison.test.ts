import { describe, expect, it } from "vitest";
import {
  type BuildingEnergyComparisonRow,
  createEnergyStandardChartData,
} from "../buildingEnergyComparison";

const translate = (key: string) =>
  key === "buildingComparison.unknown"
    ? "Unbekannt / keine Angabe"
    : key.replace("models.building_energy_standard.", "");

describe("createEnergyStandardChartData", () => {
  it("aggregates all selected months per system before averaging a standard", () => {
    const rows: BuildingEnergyComparisonRow[] = [
      {
        heating_id: "system-a",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 100,
        building_energy_standard: "kfw_55",
      },
      {
        heating_id: "system-a",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 200,
        building_energy_standard: "kfw_55",
      },
      {
        heating_id: "system-b",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 100,
        building_energy_standard: "kfw_55",
      },
    ];

    expect(createEnergyStandardChartData(rows, translate)).toEqual([
      { category: "kfw_55", value: 2, sampleSize: 2 },
    ]);
  });

  it("combines unknown and missing standards and excludes incomplete energy rows", () => {
    const rows: BuildingEnergyComparisonRow[] = [
      {
        heating_id: "unknown-standard",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 100,
        building_energy_standard: "unknown",
      },
      {
        heating_id: "missing-standard",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 300,
        building_energy_standard: null,
      },
      {
        heating_id: "missing-area",
        heated_area_m2: null,
        thermal_energy_heating_kwh: 999,
        building_energy_standard: "kfw_55",
      },
      {
        heating_id: "missing-energy",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: null,
        building_energy_standard: "kfw_55",
      },
    ];

    expect(createEnergyStandardChartData(rows, translate)).toEqual([
      { category: "Unbekannt / keine Angabe", value: 2, sampleSize: 2 },
    ]);
  });

  it("sorts standards by descending heating demand per square metre", () => {
    const rows: BuildingEnergyComparisonRow[] = [
      {
        heating_id: "low-demand",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 100,
        building_energy_standard: "kfw_55",
      },
      {
        heating_id: "high-demand",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 300,
        building_energy_standard: "old_building_unrenovated",
      },
    ];

    expect(createEnergyStandardChartData(rows, translate).map((entry) => entry.category)).toEqual([
      "old_building_unrenovated",
      "kfw_55",
    ]);
  });
});
