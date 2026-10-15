import { describe, expect, it } from "vitest";
import { filterRealisticDataForCharts, validateMeasurementData } from "../dataQuality";

const octoberOutlier = {
  month: 10,
  year: 2026,
  thermal_energy_kwh: 106.68,
  electrical_energy_kwh: 1524,
  thermal_energy_heating_kwh: 100,
  electrical_energy_heating_kwh: 25,
};

describe("monthly data quality", () => {
  it("marks and excludes non-finite total and heating AZ, including derived monthly AZ", () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      for (const row of [
        { az: value },
        { az_heating: value },
        { month: 10, thermal_energy_kwh: value, electrical_energy_kwh: 10 },
        { month: 10, thermal_energy_heating_kwh: value, electrical_energy_heating_kwh: 10 },
      ]) {
        expect(validateMeasurementData(row).isValid).toBe(false);
        expect(filterRealisticDataForCharts([row])).toEqual([]);
      }
    }
  });

  it("marks and excludes the October consumption spike even without precomputed AZ", () => {
    const validation = validateMeasurementData(octoberOutlier);
    expect(validation.isValid).toBe(false);
    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        translationKey: "dataQuality.unrealisticCopLow",
        translationParams: { cop: "0.1", min: 1 },
      }),
    );
    expect(filterRealisticDataForCharts([octoberOutlier])).toEqual([]);
  });

  it("checks heating AZ too and uses the same rules for the warning and chart", () => {
    const row = { ...octoberOutlier, az: 4, az_heating: 11 };
    expect(validateMeasurementData(row).isValid).toBe(false);
    expect(filterRealisticDataForCharts([row])).toEqual([]);
  });

  it("keeps Pumpinator's summer month with standby consumption and negligible heating", () => {
    const summerMonth = {
      month: 7,
      thermal_energy_kwh: 114.92,
      electrical_energy_kwh: 45.88,
      thermal_energy_heating_kwh: 0.01,
      electrical_energy_heating_kwh: 17.4,
    };
    for (const row of [summerMonth, { ...summerMonth, az: 2.5048, az_heating: 0.0005747 }]) {
      expect(validateMeasurementData(row).isValid).toBe(true);
      expect(filterRealisticDataForCharts([row])).toEqual([row]);
    }
  });

  it("accepts monthly AZ at the boundary and high consumption with plausible efficiency", () => {
    for (const az of [1, 4, 10]) {
      const row = { ...octoberOutlier, az, az_heating: 4 };
      expect(validateMeasurementData(row).isValid).toBe(true);
      expect(filterRealisticDataForCharts([row])).toEqual([row]);
    }
  });

  it("keeps idle months with zero heat and months with missing energy pairs", () => {
    for (const row of [
      { month: 10, az: 0, az_heating: 0 },
      { month: 10, electrical_energy_kwh: 10, thermal_energy_kwh: null },
    ]) {
      expect(validateMeasurementData(row).isValid).toBe(true);
      expect(filterRealisticDataForCharts([row])).toEqual([row]);
    }
  });

  it("preserves low positive AZ for hourly and daily measurements", () => {
    for (const row of [{ az: 0.07 }, { date: "2026-10-15", az: 0.07 }]) {
      expect(validateMeasurementData(row).isValid).toBe(true);
      expect(filterRealisticDataForCharts([row])).toEqual([row]);
    }
  });
});
