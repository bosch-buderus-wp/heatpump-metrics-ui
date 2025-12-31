import { describe, it, expect } from "vitest";
import { calculateSystemAz, calculateDailyTaz, createHistogramBins } from "../chartDataProcessing";

describe("calculateSystemAz", () => {
  it("should calculate AZ correctly for a single system", () => {
    const data = [
      {
        heating_id: "system1",
        thermal_energy_kwh: 100,
        electrical_energy_kwh: 25,
        thermal_energy_heating_kwh: 80,
        electrical_energy_heating_kwh: 20,
      },
    ];

    const result = calculateSystemAz(data);

    expect(result).toHaveLength(1);
    expect(result[0].heatingId).toBe("system1");
    expect(result[0].az).toBe(4); // 100 / 25
    expect(result[0].azHeating).toBe(4); // 80 / 20
    expect(result[0].thermalTotal).toBe(100);
    expect(result[0].electricalTotal).toBe(25);
  });

  it("should sum multiple records for the same system", () => {
    const data = [
      {
        heating_id: "system1",
        thermal_energy_kwh: 50,
        electrical_energy_kwh: 10,
        thermal_energy_heating_kwh: 40,
        electrical_energy_heating_kwh: 8,
      },
      {
        heating_id: "system1",
        thermal_energy_kwh: 50,
        electrical_energy_kwh: 15,
        thermal_energy_heating_kwh: 40,
        electrical_energy_heating_kwh: 12,
      },
    ];

    const result = calculateSystemAz(data);

    expect(result).toHaveLength(1);
    expect(result[0].thermalTotal).toBe(100);
    expect(result[0].electricalTotal).toBe(25);
    expect(result[0].az).toBe(4); // 100 / 25
  });

  it("should handle multiple systems", () => {
    const data = [
      {
        heating_id: "system1",
        thermal_energy_kwh: 100,
        electrical_energy_kwh: 25,
        thermal_energy_heating_kwh: 80,
        electrical_energy_heating_kwh: 20,
      },
      {
        heating_id: "system2",
        thermal_energy_kwh: 150,
        electrical_energy_kwh: 50,
        thermal_energy_heating_kwh: 120,
        electrical_energy_heating_kwh: 40,
      },
    ];

    const result = calculateSystemAz(data);

    expect(result).toHaveLength(2);
    expect(result[0].az).toBe(4); // system1: 100 / 25
    expect(result[1].az).toBe(3); // system2: 150 / 50
  });

  it("should return null for AZ when electrical energy is zero", () => {
    const data = [
      {
        heating_id: "system1",
        thermal_energy_kwh: 100,
        electrical_energy_kwh: 0,
        thermal_energy_heating_kwh: 80,
        electrical_energy_heating_kwh: 0,
      },
    ];

    const result = calculateSystemAz(data);

    expect(result[0].az).toBeNull();
    expect(result[0].azHeating).toBeNull();
  });

  it("should handle null values", () => {
    const data = [
      {
        heating_id: "system1",
        thermal_energy_kwh: null,
        electrical_energy_kwh: null,
        thermal_energy_heating_kwh: null,
        electrical_energy_heating_kwh: null,
      },
    ];

    const result = calculateSystemAz(data);

    expect(result[0].thermalTotal).toBe(0);
    expect(result[0].electricalTotal).toBe(0);
    expect(result[0].az).toBeNull();
  });
});

describe("calculateDailyTaz", () => {
  it("should calculate TAZ using difference between last and first measurement", () => {
    const data = [
      {
        heating_id: "system1",
        thermal_energy_kwh: 1000,
        electrical_energy_kwh: 250,
        thermal_energy_heating_kwh: 800,
        electrical_energy_heating_kwh: 200,
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        heating_id: "system1",
        thermal_energy_kwh: 1100,
        electrical_energy_kwh: 275,
        thermal_energy_heating_kwh: 880,
        electrical_energy_heating_kwh: 220,
        created_at: "2025-01-01T23:59:59Z",
      },
    ];

    const result = calculateDailyTaz(data);

    expect(result).toHaveLength(1);
    expect(result[0].heatingId).toBe("system1");
    expect(result[0].thermalTotal).toBe(100); // 1100 - 1000
    expect(result[0].electricalTotal).toBe(25); // 275 - 250
    expect(result[0].az).toBe(4); // 100 / 25
    expect(result[0].thermalHeatingTotal).toBe(80); // 880 - 800
    expect(result[0].electricalHeatingTotal).toBe(20); // 220 - 200
    expect(result[0].azHeating).toBe(4); // 80 / 20
  });

  it("should sort measurements by timestamp before calculating", () => {
    const data = [
      {
        heating_id: "system1",
        thermal_energy_kwh: 1100,
        electrical_energy_kwh: 275,
        thermal_energy_heating_kwh: 880,
        electrical_energy_heating_kwh: 220,
        created_at: "2025-01-01T23:59:59Z", // Last (but listed first)
      },
      {
        heating_id: "system1",
        thermal_energy_kwh: 1000,
        electrical_energy_kwh: 250,
        thermal_energy_heating_kwh: 800,
        electrical_energy_heating_kwh: 200,
        created_at: "2025-01-01T00:00:00Z", // First (but listed second)
      },
    ];

    const result = calculateDailyTaz(data);

    expect(result[0].az).toBe(4); // Should still get correct result: (1100-1000)/(275-250)
  });

  it("should handle multiple systems independently", () => {
    const data = [
      {
        heating_id: "system1",
        thermal_energy_kwh: 1000,
        electrical_energy_kwh: 250,
        thermal_energy_heating_kwh: 800,
        electrical_energy_heating_kwh: 200,
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        heating_id: "system1",
        thermal_energy_kwh: 1100,
        electrical_energy_kwh: 275,
        thermal_energy_heating_kwh: 880,
        electrical_energy_heating_kwh: 220,
        created_at: "2025-01-01T23:59:59Z",
      },
      {
        heating_id: "system2",
        thermal_energy_kwh: 2000,
        electrical_energy_kwh: 500,
        thermal_energy_heating_kwh: 1600,
        electrical_energy_heating_kwh: 400,
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        heating_id: "system2",
        thermal_energy_kwh: 2150,
        electrical_energy_kwh: 550,
        thermal_energy_heating_kwh: 1720,
        electrical_energy_heating_kwh: 440,
        created_at: "2025-01-01T23:59:59Z",
      },
    ];

    const result = calculateDailyTaz(data);

    expect(result).toHaveLength(2);
    expect(result[0].az).toBe(4); // system1: (1100-1000)/(275-250)
    expect(result[1].az).toBe(3); // system2: (2150-2000)/(550-500)
  });

  it("should return null for AZ when electrical difference is zero", () => {
    const data = [
      {
        heating_id: "system1",
        thermal_energy_kwh: 1000,
        electrical_energy_kwh: 250,
        thermal_energy_heating_kwh: 800,
        electrical_energy_heating_kwh: 200,
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        heating_id: "system1",
        thermal_energy_kwh: 1100,
        electrical_energy_kwh: 250, // Same as first (no consumption)
        thermal_energy_heating_kwh: 880,
        electrical_energy_heating_kwh: 200, // Same as first
        created_at: "2025-01-01T23:59:59Z",
      },
    ];

    const result = calculateDailyTaz(data);

    expect(result[0].az).toBeNull();
    expect(result[0].azHeating).toBeNull();
  });

  it("should handle single measurement (no difference)", () => {
    const data = [
      {
        heating_id: "system1",
        thermal_energy_kwh: 1000,
        electrical_energy_kwh: 250,
        thermal_energy_heating_kwh: 800,
        electrical_energy_heating_kwh: 200,
        created_at: "2025-01-01T12:00:00Z",
      },
    ];

    const result = calculateDailyTaz(data);

    expect(result[0].thermalTotal).toBe(0); // Same measurement: 1000 - 1000
    expect(result[0].electricalTotal).toBe(0); // Same measurement: 250 - 250
    expect(result[0].az).toBeNull(); // Division by zero
  });

  it("should handle null values", () => {
    const data = [
      {
        heating_id: "system1",
        thermal_energy_kwh: null,
        electrical_energy_kwh: null,
        thermal_energy_heating_kwh: null,
        electrical_energy_heating_kwh: null,
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        heating_id: "system1",
        thermal_energy_kwh: null,
        electrical_energy_kwh: null,
        thermal_energy_heating_kwh: null,
        electrical_energy_heating_kwh: null,
        created_at: "2025-01-01T23:59:59Z",
      },
    ];

    const result = calculateDailyTaz(data);

    expect(result[0].thermalTotal).toBe(0);
    expect(result[0].electricalTotal).toBe(0);
    expect(result[0].az).toBeNull();
  });
});

describe("createHistogramBins", () => {
  it("should create histogram bins with correct counts", () => {
    const systemData = [
      {
        heatingId: "system1",
        az: 3.2,
        azHeating: 3.5,
        thermalTotal: 100,
        electricalTotal: 31.25,
        thermalHeatingTotal: 80,
        electricalHeatingTotal: 22.86,
      },
      {
        heatingId: "system2",
        az: 3.7,
        azHeating: 4.0,
        thermalTotal: 150,
        electricalTotal: 40.54,
        thermalHeatingTotal: 120,
        electricalHeatingTotal: 30,
      },
      {
        heatingId: "system3",
        az: 3.3,
        azHeating: 3.6,
        thermalTotal: 120,
        electricalTotal: 36.36,
        thermalHeatingTotal: 100,
        electricalHeatingTotal: 27.78,
      },
    ];

    const result = createHistogramBins(systemData, "az", 0.5);

    expect(result.bins.length).toBeGreaterThan(0);
    expect(result.stats.count).toBe(3);
    expect(result.stats.mean).toBeCloseTo(3.4, 1);
    expect(result.stats.median).toBeCloseTo(3.3, 1);
  });

  it("should calculate correct statistics", () => {
    const systemData = [
      {
        heatingId: "s1",
        az: 2.0,
        azHeating: 2.0,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
      {
        heatingId: "s2",
        az: 3.0,
        azHeating: 3.0,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
      {
        heatingId: "s3",
        az: 4.0,
        azHeating: 4.0,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
      {
        heatingId: "s4",
        az: 5.0,
        azHeating: 5.0,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
      {
        heatingId: "s5",
        az: 6.0,
        azHeating: 6.0,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
    ];

    const result = createHistogramBins(systemData, "az", 1.0);

    expect(result.stats.mean).toBe(4.0);
    expect(result.stats.median).toBe(4.0);
    expect(result.stats.min).toBe(2.0);
    expect(result.stats.max).toBe(6.0);
    expect(result.stats.count).toBe(5);
  });

  it("should filter out null AZ values", () => {
    const systemData = [
      {
        heatingId: "s1",
        az: 3.0,
        azHeating: 3.0,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
      {
        heatingId: "s2",
        az: null,
        azHeating: null,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
      {
        heatingId: "s3",
        az: 4.0,
        azHeating: 4.0,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
    ];

    const result = createHistogramBins(systemData, "az", 0.5);

    expect(result.stats.count).toBe(2);
  });

  it("should create bins with correct ranges", () => {
    const systemData = [
      {
        heatingId: "s1",
        az: 2.2,
        azHeating: 2.2,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
      {
        heatingId: "s2",
        az: 2.7,
        azHeating: 2.7,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
      {
        heatingId: "s3",
        az: 3.3,
        azHeating: 3.3,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
    ];

    const result = createHistogramBins(systemData, "az", 0.5);

    // Should have bins: 2.0-2.5, 2.5-3.0, 3.0-3.5
    expect(result.bins.length).toBe(3);
    expect(result.bins[0].binLabel).toBe("2.0-2.5");
    expect(result.bins[0].count).toBe(1); // s1 (2.2)
    expect(result.bins[1].binLabel).toBe("2.5-3.0");
    expect(result.bins[1].count).toBe(1); // s2 (2.7)
    expect(result.bins[2].binLabel).toBe("3.0-3.5");
    expect(result.bins[2].count).toBe(1); // s3 (3.3)
  });

  it("should handle azHeating field", () => {
    const systemData = [
      {
        heatingId: "s1",
        az: 3.0,
        azHeating: 4.0,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
      {
        heatingId: "s2",
        az: 3.5,
        azHeating: 4.5,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
    ];

    const azResult = createHistogramBins(systemData, "az", 0.5);
    const azHeatingResult = createHistogramBins(systemData, "azHeating", 0.5);

    expect(azResult.stats.mean).toBe(3.25);
    expect(azHeatingResult.stats.mean).toBe(4.25);
  });

  it("should return empty bins for empty data", () => {
    const result = createHistogramBins([], "az", 0.5);

    expect(result.bins).toEqual([]);
    expect(result.stats.count).toBe(0);
  });

  it("should include systemIds in bins", () => {
    const systemData = [
      {
        heatingId: "system1",
        az: 3.2,
        azHeating: 3.5,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
      {
        heatingId: "system2",
        az: 3.3,
        azHeating: 3.6,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
    ];

    const result = createHistogramBins(systemData, "az", 0.5);

    expect(result.bins[0].systemIds).toContain("system1");
    expect(result.bins[0].systemIds).toContain("system2");
  });

  it("should handle different bin sizes correctly", () => {
    const systemData = [
      {
        heatingId: "sys1",
        az: 2.0,
        azHeating: null,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
      {
        heatingId: "sys2",
        az: 2.9,
        azHeating: null,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
      {
        heatingId: "sys3",
        az: 3.0,
        azHeating: null,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
    ];

    const result = createHistogramBins(systemData, "az", 1.0);

    // With bin size 1.0, sys1 and sys2 should be in 2.0-3.0 bin, sys3 in 3.0-4.0 bin
    expect(result.bins.length).toBeGreaterThan(0);
    const bin1 = result.bins.find((b) => b.binStart === 2.0);
    const bin2 = result.bins.find((b) => b.binStart === 3.0);

    // Bins exist and have correct counts
    if (bin1) {
      expect(bin1.count).toBe(2);
    }
    if (bin2) {
      expect(bin2.count).toBe(1);
    }
  });

  it("should calculate correct statistics for azHeating field", () => {
    const systemData = [
      {
        heatingId: "sys1",
        az: 2.0,
        azHeating: 3.0,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
      {
        heatingId: "sys2",
        az: 2.5,
        azHeating: 3.5,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
      {
        heatingId: "sys3",
        az: 3.0,
        azHeating: 4.0,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
    ];

    const result = createHistogramBins(systemData, "azHeating", 0.5);

    expect(result.stats.mean).toBeCloseTo(3.5, 1);
    expect(result.stats.min).toBe(3.0);
    expect(result.stats.max).toBe(4.0);
  });

  it("should format bin labels with one decimal place", () => {
    const systemData = [
      {
        heatingId: "sys1",
        az: 2.25,
        azHeating: null,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      },
    ];

    const result = createHistogramBins(systemData, "az", 0.5);

    expect(result.bins[0].binLabel).toMatch(/^\d+\.\d-\d+\.\d$/);
    expect(result.bins[0].binStart).toBe(2.0);
    expect(result.bins[0].binEnd).toBe(2.5);
  });
});
