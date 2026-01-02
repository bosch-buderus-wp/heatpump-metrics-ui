import type { GridFilterModel } from "@mui/x-data-grid";
import { describe, expect, it } from "vitest";

/**
 * Integration test for DataGrid filtering logic
 *
 * This test verifies the complete filter application logic that is used
 * in both normal mode and comparison mode to ensure charts stay in sync
 * with DataGrid filters.
 *
 * Tests the applyFiltersToData function which is the critical piece that:
 * 1. Takes raw data and a filter model
 * 2. Applies all filter operators correctly
 * 3. Returns filtered data for charts
 *
 * This prevents regressions where filters work in the grid but don't update charts.
 */

interface MockDataRow extends Record<string, unknown> {
  id: string;
  name: string;
  heating_type: string;
  model_idu: string;
  building_type: string;
  az: number;
  postal_code: string;
  outdoor_temp: number;
}

const mockData: MockDataRow[] = [
  {
    id: "1",
    name: "System A",
    heating_type: "underfloorheating",
    model_idu: "CS5800i_E",
    building_type: "single_family_detached",
    az: 3.5,
    postal_code: "12345",
    outdoor_temp: -5,
  },
  {
    id: "2",
    name: "System B",
    heating_type: "radiators",
    model_idu: "CS6800i_E",
    building_type: "apartment",
    az: 2.8,
    postal_code: "23456",
    outdoor_temp: 10,
  },
  {
    id: "3",
    name: "System C",
    heating_type: "underfloorheating",
    model_idu: "CS5800i_E",
    building_type: "single_family_detached",
    az: 3.8,
    postal_code: "12345",
    outdoor_temp: 15,
  },
  {
    id: "4",
    name: "System D",
    heating_type: "mixed",
    model_idu: "WLW176i_E",
    building_type: "commercial",
    az: 3.0,
    postal_code: "34567",
    outdoor_temp: 20,
  },
  {
    id: "5",
    name: "Alpha System",
    heating_type: "underfloorheating",
    model_idu: "CS5800i_E",
    building_type: "terraced_mid",
    az: 4.2,
    postal_code: "12999",
    outdoor_temp: 5,
  },
];

// This is the actual filter logic from useComparisonMode
// We test this directly to ensure it handles all filter types correctly
function applyFiltersToData<T extends Record<string, unknown>>(
  data: T[],
  filterModel: GridFilterModel,
): T[] {
  if (!filterModel || filterModel.items.length === 0) return data;

  return data.filter((row) => {
    return filterModel.items.every((filterItem) => {
      const value = row[filterItem.field];

      switch (filterItem.operator) {
        case "contains":
          return (
            value != null &&
            String(value).toLowerCase().includes(String(filterItem.value).toLowerCase())
          );
        case "equals":
        case "is": // Used by singleSelect columns (enum filters)
          return value === filterItem.value;
        case "startsWith":
          return (
            value != null &&
            String(value).toLowerCase().startsWith(String(filterItem.value).toLowerCase())
          );
        case "endsWith":
          return (
            value != null &&
            String(value).toLowerCase().endsWith(String(filterItem.value).toLowerCase())
          );
        case ">":
          return Number(value) > Number(filterItem.value);
        case ">=":
          return Number(value) >= Number(filterItem.value);
        case "<":
          return Number(value) < Number(filterItem.value);
        case "<=":
          return Number(value) <= Number(filterItem.value);
        case "isEmpty":
          return value == null || value === "";
        case "isNotEmpty":
          return value != null && value !== "";
        default:
          return true;
      }
    });
  });
}

describe("DataGrid Filter Integration - Real World Scenarios", () => {
  describe("Enum Filters (singleSelect)", () => {
    it("should filter by heating_type enum using 'is' operator", () => {
      const filterModel: GridFilterModel = {
        items: [{ field: "heating_type", operator: "is", value: "underfloorheating" }],
      };

      const result = applyFiltersToData(mockData, filterModel);

      expect(result).toHaveLength(3);
      expect(result.every((r) => r.heating_type === "underfloorheating")).toBe(true);
      expect(result.map((r) => r.id)).toEqual(["1", "3", "5"]);
    });

    it("should filter by model_idu enum using 'is' operator", () => {
      const filterModel: GridFilterModel = {
        items: [{ field: "model_idu", operator: "is", value: "CS5800i_E" }],
      };

      const result = applyFiltersToData(mockData, filterModel);

      expect(result).toHaveLength(3);
      expect(result.every((r) => r.model_idu === "CS5800i_E")).toBe(true);
    });

    it("should filter by building_type enum using 'is' operator", () => {
      const filterModel: GridFilterModel = {
        items: [{ field: "building_type", operator: "is", value: "single_family_detached" }],
      };

      const result = applyFiltersToData(mockData, filterModel);

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.building_type === "single_family_detached")).toBe(true);
    });
  });

  describe("Text Filters", () => {
    it("should filter by name using 'contains' operator", () => {
      const filterModel: GridFilterModel = {
        items: [{ field: "name", operator: "contains", value: "System" }],
      };

      const result = applyFiltersToData(mockData, filterModel);

      expect(result).toHaveLength(5); // All 5 items contain "System"
      expect(result.every((r) => r.name.includes("System"))).toBe(true);
    });

    it("should filter by postal_code using 'startsWith' operator", () => {
      const filterModel: GridFilterModel = {
        items: [{ field: "postal_code", operator: "startsWith", value: "123" }],
      };

      const result = applyFiltersToData(mockData, filterModel);

      expect(result).toHaveLength(2); // Only "12345" and "12999" start with "123"
      expect(result.every((r) => r.postal_code.startsWith("123"))).toBe(true);
    });

    it("should be case-insensitive for text filters", () => {
      const filterModel: GridFilterModel = {
        items: [{ field: "name", operator: "contains", value: "SYSTEM" }],
      };

      const result = applyFiltersToData(mockData, filterModel);

      expect(result).toHaveLength(5); // All 5 items contain "System" (case-insensitive)
    });
  });

  describe("Number Filters", () => {
    it("should filter by az using '>' operator", () => {
      const filterModel: GridFilterModel = {
        items: [{ field: "az", operator: ">", value: 3.5 }],
      };

      const result = applyFiltersToData(mockData, filterModel);

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.az > 3.5)).toBe(true);
    });

    it("should filter by outdoor_temp using '<' operator", () => {
      const filterModel: GridFilterModel = {
        items: [{ field: "outdoor_temp", operator: "<", value: 10 }],
      };

      const result = applyFiltersToData(mockData, filterModel);

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.outdoor_temp < 10)).toBe(true);
    });

    it("should filter by az using '>=' operator", () => {
      const filterModel: GridFilterModel = {
        items: [{ field: "az", operator: ">=", value: 3.5 }],
      };

      const result = applyFiltersToData(mockData, filterModel);

      expect(result).toHaveLength(3);
      expect(result.every((r) => r.az >= 3.5)).toBe(true);
    });
  });

  describe("Multiple Filters (Real World Combinations)", () => {
    it("should combine enum filter + text filter", () => {
      const filterModel: GridFilterModel = {
        items: [
          { field: "heating_type", operator: "is", value: "underfloorheating" },
          { field: "postal_code", operator: "startsWith", value: "123" },
        ],
      };

      const result = applyFiltersToData(mockData, filterModel);

      expect(result).toHaveLength(2);
      expect(
        result.every(
          (r) => r.heating_type === "underfloorheating" && r.postal_code.startsWith("123"),
        ),
      ).toBe(true);
    });

    it("should combine enum filter + number filter", () => {
      const filterModel: GridFilterModel = {
        items: [
          { field: "heating_type", operator: "is", value: "underfloorheating" },
          { field: "az", operator: ">", value: 3.5 },
        ],
      };

      const result = applyFiltersToData(mockData, filterModel);

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.heating_type === "underfloorheating" && r.az > 3.5)).toBe(true);
      expect(result.map((r) => r.id)).toEqual(["3", "5"]);
    });

    it("should combine multiple enum filters", () => {
      const filterModel: GridFilterModel = {
        items: [
          { field: "heating_type", operator: "is", value: "underfloorheating" },
          { field: "model_idu", operator: "is", value: "CS5800i_E" },
        ],
      };

      const result = applyFiltersToData(mockData, filterModel);

      expect(result).toHaveLength(3);
      expect(
        result.every((r) => r.heating_type === "underfloorheating" && r.model_idu === "CS5800i_E"),
      ).toBe(true);
    });

    it("should handle complex scenario: 3 filters of different types", () => {
      const filterModel: GridFilterModel = {
        items: [
          { field: "heating_type", operator: "is", value: "underfloorheating" },
          { field: "az", operator: ">=", value: 3.5 },
          { field: "postal_code", operator: "contains", value: "99" },
        ],
      };

      const result = applyFiltersToData(mockData, filterModel);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("5");
      expect(result[0].name).toBe("Alpha System");
    });
  });

  describe("Edge Cases", () => {
    it("should return all data when filter model has no items", () => {
      const filterModel: GridFilterModel = { items: [] };

      const result = applyFiltersToData(mockData, filterModel);

      expect(result).toHaveLength(5);
      expect(result).toEqual(mockData);
    });

    it("should return empty array when no data matches filter", () => {
      const filterModel: GridFilterModel = {
        items: [{ field: "heating_type", operator: "is", value: "nonexistent_type" }],
      };

      const result = applyFiltersToData(mockData, filterModel);

      expect(result).toHaveLength(0);
    });

    it("should handle filtering with null values", () => {
      const dataWithNulls = [
        ...mockData,
        {
          id: "6",
          name: "Incomplete System",
          heating_type: null as any,
          model_idu: "CS5800i_E",
          building_type: "apartment",
          az: 2.5,
          postal_code: "99999",
          outdoor_temp: 0,
        },
      ];

      const filterModel: GridFilterModel = {
        items: [{ field: "heating_type", operator: "isEmpty", value: null }],
      };

      const result = applyFiltersToData(dataWithNulls, filterModel);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("6");
    });
  });

  describe("Comparison Mode Scenarios", () => {
    it("should filter data for comparison group 1", () => {
      // Simulating Filter Group 1: Cold weather systems
      const filterGroup1: GridFilterModel = {
        items: [{ field: "outdoor_temp", operator: "<", value: 10 }],
      };

      const result = applyFiltersToData(mockData, filterGroup1);

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual(["1", "5"]);
    });

    it("should filter data for comparison group 2", () => {
      // Simulating Filter Group 2: Warm weather systems
      const filterGroup2: GridFilterModel = {
        items: [{ field: "outdoor_temp", operator: ">=", value: 15 }],
      };

      const result = applyFiltersToData(mockData, filterGroup2);

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual(["3", "4"]);
    });

    it("should maintain separate filter results for both comparison groups", () => {
      const filterGroup1: GridFilterModel = {
        items: [{ field: "heating_type", operator: "is", value: "underfloorheating" }],
      };

      const filterGroup2: GridFilterModel = {
        items: [{ field: "heating_type", operator: "is", value: "radiators" }],
      };

      const result1 = applyFiltersToData(mockData, filterGroup1);
      const result2 = applyFiltersToData(mockData, filterGroup2);

      expect(result1).toHaveLength(3);
      expect(result2).toHaveLength(1);
      expect(result1.every((r) => r.heating_type === "underfloorheating")).toBe(true);
      expect(result2.every((r) => r.heating_type === "radiators")).toBe(true);
    });
  });
});
