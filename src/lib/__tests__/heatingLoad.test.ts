import { describe, expect, it } from "vitest";
import { analyzeHeatingLoad, type HeatingLoadDailyValue } from "../heatingLoad";

function days(): HeatingLoadDailyValue[] {
  return Array.from({ length: 12 }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, "0")}`,
    outdoor_temperature_c: i - 5,
    thermal_energy_heating_kwh: (5 - 0.2 * (i - 5)) * 24,
  }));
}

describe("heating load analysis", () => {
  it("uses daily heating energy as average power and extrapolates to design temperature", () => {
    const result = analyzeHeatingLoad(days(), -10);
    expect(result.points[0].y).toBeCloseTo(6);
    expect(result.regression?.slope).toBeCloseTo(-0.2);
    expect(result.estimate).toBeCloseTo(7);
    expect(result.extrapolation).toBe(5);
    expect(result.startDate).toBe("2026-01-01");
    expect(result.endDate).toBe("2026-01-12");
  });

  it("rejects missing, invalid and non-heating or warm daily values", () => {
    const result = analyzeHeatingLoad(
      [
        ...days(),
        { date: "2026-01-13", outdoor_temperature_c: 20, thermal_energy_heating_kwh: 20 },
        { date: "2026-01-14", outdoor_temperature_c: 0, thermal_energy_heating_kwh: 0 },
        { date: "2026-01-15", outdoor_temperature_c: 0, thermal_energy_heating_kwh: -1 },
        { date: "2026-01-16", outdoor_temperature_c: Number.NaN, thermal_energy_heating_kwh: 10 },
        { date: "2026-01-17", outdoor_temperature_c: 0, thermal_energy_heating_kwh: null },
      ],
      -10,
    );
    expect(result.points).toHaveLength(12);
  });

  it("does not calculate an estimate with too few days, narrow or mild temperatures, or a rising trend", () => {
    expect(analyzeHeatingLoad(days().slice(0, 9), -10).estimate).toBeNull();
    expect(
      analyzeHeatingLoad(
        days().map((row, i) => ({ ...row, outdoor_temperature_c: i / 4 })),
        -10,
      ).estimate,
    ).toBeNull();
    expect(
      analyzeHeatingLoad(
        days().map((row, i) => ({ ...row, outdoor_temperature_c: 6 + i * 0.5 })),
        -10,
      ).estimate,
    ).toBeNull();
    expect(
      analyzeHeatingLoad(
        days().map((row, i) => ({ ...row, thermal_energy_heating_kwh: 20 + i * 5 })),
        -10,
      ).estimate,
    ).toBeNull();
  });

  it("shows a regression without inventing a missing design temperature", () => {
    const result = analyzeHeatingLoad(days(), null);
    expect(result.regression).not.toBeNull();
    expect(result.estimate).toBeNull();
    expect(result.extrapolation).toBeNull();
  });
});
