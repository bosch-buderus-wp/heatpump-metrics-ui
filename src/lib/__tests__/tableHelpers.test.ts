import { describe, expect, it } from "vitest";
import { computeAz } from "../tableHelpers";

describe("tableHelpers", () => {
  describe("computeAz", () => {
    it("computes AZ (COP) from thermal and electrical energy", () => {
      const row = {
        thermal_energy_kwh: 100,
        electrical_energy_kwh: 25,
        thermal_energy_heating_kwh: 80,
        electrical_energy_heating_kwh: 20,
      };

      const result = computeAz(row);

      expect(result.az).toBe(4); // 100 / 25
      expect(result.azHeating).toBe(4); // 80 / 20
    });

    it("returns null when electrical energy is zero", () => {
      const row = {
        thermal_energy_kwh: 100,
        electrical_energy_kwh: 0,
        thermal_energy_heating_kwh: 80,
        electrical_energy_heating_kwh: 0,
      };

      const result = computeAz(row);

      expect(result.az).toBeNull();
      expect(result.azHeating).toBeNull();
    });

    it("returns null when electrical energy is undefined", () => {
      const row = {
        thermal_energy_kwh: 100,
        thermal_energy_heating_kwh: 80,
      };

      const result = computeAz(row);

      expect(result.az).toBeNull();
      expect(result.azHeating).toBeNull();
    });

    it("treats null thermal energy as 0 in calculation", () => {
      const row = {
        thermal_energy_kwh: null,
        electrical_energy_kwh: 25,
        thermal_energy_heating_kwh: null,
        electrical_energy_heating_kwh: 20,
      };

      const result = computeAz(row);

      expect(result.az).toBe(0); // 0 / 25
      expect(result.azHeating).toBe(0); // 0 / 20
    });

    it("handles realistic heat pump values", () => {
      const row = {
        thermal_energy_kwh: 350,
        electrical_energy_kwh: 100,
        thermal_energy_heating_kwh: 300,
        electrical_energy_heating_kwh: 85,
      };

      const result = computeAz(row);

      expect(result.az).toBe(3.5);
      expect(result.azHeating).toBeCloseTo(3.53, 2);
    });

    it("computes only total AZ when heating values are missing", () => {
      const row = {
        thermal_energy_kwh: 100,
        electrical_energy_kwh: 25,
      };

      const result = computeAz(row);

      expect(result.az).toBe(4);
      expect(result.azHeating).toBeNull();
    });

    it("computes only heating AZ when total values are missing", () => {
      const row = {
        thermal_energy_heating_kwh: 80,
        electrical_energy_heating_kwh: 20,
      };

      const result = computeAz(row);

      expect(result.az).toBeNull();
      expect(result.azHeating).toBe(4);
    });

    it("handles very small electrical energy values without division by zero", () => {
      const row = {
        thermal_energy_kwh: 1,
        electrical_energy_kwh: 0.001,
        thermal_energy_heating_kwh: 1,
        electrical_energy_heating_kwh: 0.001,
      };

      const result = computeAz(row);

      expect(result.az).toBe(1000);
      expect(result.azHeating).toBe(1000);
    });
  });
});
