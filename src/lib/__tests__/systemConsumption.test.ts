import { describe, expect, it } from "vitest";
import {
  getPeriodHours,
  removeSystemConsumption,
  SYSTEM_CONSUMPTION_KW,
} from "../systemConsumption";

describe("system consumption correction", () => {
  it("subtracts 25 W from total and heating energy and recalculates both AZ values", () => {
    const result = removeSystemConsumption(
      {
        thermal_energy_kwh: 4,
        electrical_energy_kwh: 1,
        thermal_energy_heating_kwh: 3,
        electrical_energy_heating_kwh: 0.75,
      },
      "hour",
    );

    expect(SYSTEM_CONSUMPTION_KW).toBe(0.025);
    expect(result.electrical_energy_kwh).toBeCloseTo(0.975);
    expect(result.electrical_energy_heating_kwh).toBeCloseTo(0.725);
    expect(result.az).toBeCloseTo(4 / 0.975);
    expect(result.az_heating).toBeCloseTo(3 / 0.725);
  });

  it("never creates negative energy or an infinite AZ", () => {
    const result = removeSystemConsumption(
      {
        thermal_energy_kwh: 1,
        electrical_energy_kwh: 0.01,
        thermal_energy_heating_kwh: 0,
        electrical_energy_heating_kwh: 0.01,
      },
      "hour",
    );

    expect(result.electrical_energy_kwh).toBe(0);
    expect(result.electrical_energy_heating_kwh).toBe(0);
    expect(result.az).toBeNull();
    expect(result.az_heating).toBeNull();
  });

  it("uses elapsed time for an incomplete current day", () => {
    const now = new Date("2026-07-02T12:00:00");
    expect(getPeriodHours({ date: "2026-07-02" }, "day", now)).toBe(12);
    expect(getPeriodHours({ date: "2026-07-01" }, "day", now)).toBe(24);
  });

  it("uses the actual number of hours in a completed month", () => {
    const now = new Date("2026-03-15T00:00:00");
    expect(getPeriodHours({ year: 2026, month: 2 }, "month", now)).toBe(28 * 24);
  });
});
