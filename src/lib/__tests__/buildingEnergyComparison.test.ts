import { describe, expect, it } from "vitest";
import {
  type BuildingEnergyComparisonRow,
  createEnergyStandardChartData,
  createEnergyStandardFlowTemperatureData,
  createHeatingSeasonData,
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

describe("createEnergyStandardFlowTemperatureData", () => {
  it("averages each system before averaging and excludes implausible values", () => {
    const rows = [
      {
        heating_id: "system-a",
        flow_temperature_c: 30,
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-a",
        flow_temperature_c: 34,
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-b",
        flow_temperature_c: 40,
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "invalid-flow",
        flow_temperature_c: 90,
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "unknown-standard",
        flow_temperature_c: 35,
        building_energy_standard: null,
      },
    ];

    expect(createEnergyStandardFlowTemperatureData(rows, translate)).toEqual([
      { category: "kfw_55", value: 36, sampleSize: 2 },
      { category: "Unbekannt / keine Angabe", value: 35, sampleSize: 1 },
    ]);
  });

  it("returns no categories when no usable flow temperatures are available", () => {
    expect(createEnergyStandardFlowTemperatureData(undefined, translate)).toEqual([]);

    expect(
      createEnergyStandardFlowTemperatureData(
        [
          {
            heating_id: null,
            flow_temperature_c: 35,
            building_energy_standard: "kfw_55",
          },
          {
            heating_id: "missing-flow",
            flow_temperature_c: null,
            building_energy_standard: "kfw_55",
          },
          {
            heating_id: "too-low-flow",
            flow_temperature_c: 10,
            building_energy_standard: "kfw_55",
          },
        ],
        translate,
      ),
    ).toEqual([]);
  });
});

describe("createHeatingSeasonData", () => {
  it("marks a month as part of the heating season when at least half of systems heat", () => {
    const rows = [
      {
        heating_id: "system-a",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 300,
        month: 1,
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-a",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 300,
        month: 1,
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-b",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 200,
        month: 1,
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-a",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 500,
        month: 3,
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-b",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 0,
        month: 3,
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-a",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 200,
        month: 2,
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-b",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 200,
        month: 2,
        building_energy_standard: "kfw_55" as const,
      },
    ];

    const [kfw55] = createHeatingSeasonData(rows, translate);

    expect(kfw55.months.slice(0, 3)).toEqual([
      { month: 1, active: true, activeShare: 0.5, sampleSize: 2 },
      { month: 2, active: false, activeShare: 0, sampleSize: 2 },
      { month: 3, active: true, activeShare: 0.5, sampleSize: 2 },
    ]);
    expect(kfw55.months).toHaveLength(12);
  });

  it("ignores incomplete rows and returns no categories without valid systems", () => {
    expect(createHeatingSeasonData(undefined, translate)).toEqual([]);

    expect(
      createHeatingSeasonData(
        [
          {
            heating_id: null,
            heated_area_m2: 100,
            thermal_energy_heating_kwh: 400,
            month: 1,
            building_energy_standard: "kfw_55",
          },
          {
            heating_id: "invalid-month",
            heated_area_m2: 100,
            thermal_energy_heating_kwh: 400,
            month: 13,
            building_energy_standard: "kfw_55",
          },
          {
            heating_id: "negative-energy",
            heated_area_m2: 100,
            thermal_energy_heating_kwh: -1,
            month: 1,
            building_energy_standard: "kfw_55",
          },
        ],
        translate,
      ),
    ).toEqual([]);
  });
});
