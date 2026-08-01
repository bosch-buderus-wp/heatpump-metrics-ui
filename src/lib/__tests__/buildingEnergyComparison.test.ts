import { describe, expect, it } from "vitest";
import {
  type BuildingEnergyComparisonRow,
  createEnergyStandardChartData,
  createEnergyStandardFlowTemperatureData,
  createHeatingSeasonWeekData,
  filterHeatingDemandRows,
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

describe("filterHeatingDemandRows", () => {
  const now = new Date("2026-07-31T12:00:00Z");
  const baseRow = {
    heating_id: "system-a",
    heated_area_m2: 100,
    thermal_energy_heating_kwh: 100,
    building_energy_standard: "kfw_55" as const,
    is_manual_override: false,
    last_auto_calculated_at: "2026-02-01T03:00:00Z",
    month: 1,
  };

  it("keeps manual corrections and complete automatic values", () => {
    expect(
      filterHeatingDemandRows(
        [
          baseRow,
          {
            ...baseRow,
            heating_id: "manual",
            is_manual_override: true,
            last_auto_calculated_at: null,
          },
          { ...baseRow, heating_id: "incomplete", last_auto_calculated_at: null },
        ],
        2026,
        1,
        now,
      ).map((row) => row.heating_id),
    ).toEqual(["system-a", "manual"]);
  });

  it("excludes the running month only when all months are selected", () => {
    expect(
      filterHeatingDemandRows(
        [
          { ...baseRow, heating_id: "june", month: 6 },
          { ...baseRow, heating_id: "july", month: 7 },
        ],
        2026,
        0,
        now,
      ).map((row) => row.heating_id),
    ).toEqual(["june"]);

    expect(
      filterHeatingDemandRows([{ ...baseRow, heating_id: "july", month: 7 }], 2026, 7, now),
    ).toHaveLength(1);
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

describe("createHeatingSeasonWeekData", () => {
  it("marks a week as part of the heating season when at least half of systems heat", () => {
    const rows = [
      {
        heating_id: "system-a",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 10,
        date: "2026-01-01",
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-a",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 10,
        date: "2026-01-02",
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-a",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 10,
        date: "2026-01-03",
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-b",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 0,
        date: "2026-01-01",
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-b",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 0,
        date: "2026-01-02",
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-b",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 0,
        date: "2026-01-03",
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-a",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 0,
        date: "2026-01-08",
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-a",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 0,
        date: "2026-01-09",
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-a",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 0,
        date: "2026-01-10",
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-b",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 0,
        date: "2026-01-08",
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-b",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 0,
        date: "2026-01-09",
        building_energy_standard: "kfw_55" as const,
      },
      {
        heating_id: "system-b",
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 0,
        date: "2026-01-10",
        building_energy_standard: "kfw_55" as const,
      },
    ];

    const [kfw55] = createHeatingSeasonWeekData(rows, 2026, translate);

    expect(kfw55.weeks.slice(0, 2)).toMatchObject([
      { active: true, activeShare: 0.5, sampleSize: 2 },
      { active: false, activeShare: 0, sampleSize: 2 },
    ]);
    expect(kfw55.weeks).toHaveLength(53);
  });

  it("ignores incomplete rows and returns no categories without valid systems", () => {
    expect(createHeatingSeasonWeekData(undefined, 2026, translate)).toEqual([]);

    expect(
      createHeatingSeasonWeekData(
        [
          {
            heating_id: null,
            heated_area_m2: 100,
            thermal_energy_heating_kwh: 400,
            date: "2026-01-01",
            building_energy_standard: "kfw_55",
          },
          {
            heating_id: "invalid-date",
            heated_area_m2: 100,
            thermal_energy_heating_kwh: 400,
            date: "invalid-date",
            building_energy_standard: "kfw_55",
          },
          {
            heating_id: "negative-energy",
            heated_area_m2: 100,
            thermal_energy_heating_kwh: -1,
            date: "2026-01-01",
            building_energy_standard: "kfw_55",
          },
        ],
        2026,
        translate,
      ),
    ).toEqual([]);
  });
});
