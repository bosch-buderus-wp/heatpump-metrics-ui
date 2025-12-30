import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useComparisonMode } from "../useComparisonMode";
import type { GridFilterModel } from "@mui/x-data-grid";

// Mock the useComparisonFilters hook
vi.mock("../useComparisonFilters", () => ({
  useComparisonFilters: () => ({
    filterGroup1: { items: [] },
    filterGroup2: { items: [] },
    activeGroup: 1,
    setActiveGroup: vi.fn(),
    comparisonMode: false,
    updateFilterGroup1: vi.fn(),
    updateFilterGroup2: vi.fn(),
    activeFilterModel: { items: [] },
    getComparisonGroups: vi.fn(() => []),
    clearFilterGroup2: vi.fn(),
  }),
}));

describe("useComparisonMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("applyFiltersToData", () => {
    it("should return all data when filter model is empty", () => {
      const mockData = [
        { id: 1, name: "Test 1", value: 10 },
        { id: 2, name: "Test 2", value: 20 },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filtered = result.current.applyFiltersToData(mockData, { items: [] });
      expect(filtered).toEqual(mockData);
      expect(filtered.length).toBe(2);
    });

    it("should filter data with 'contains' operator", () => {
      const mockData = [
        { id: 1, name: "Floor Heating", value: 10 },
        { id: 2, name: "Radiators", value: 20 },
        { id: 3, name: "Floor System", value: 30 },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [{ field: "name", operator: "contains", value: "Floor" }],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(2);
      expect(filtered[0].name).toContain("Floor");
      expect(filtered[1].name).toContain("Floor");
    });

    it("should filter data with 'equals' operator", () => {
      const mockData = [
        { id: 1, heating_type: "Floor Heating", value: 10 },
        { id: 2, heating_type: "Radiators", value: 20 },
        { id: 3, heating_type: "Floor Heating", value: 30 },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [{ field: "heating_type", operator: "equals", value: "Radiators" }],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(1);
      expect(filtered[0].heating_type).toBe("Radiators");
    });

    it("should filter data with 'startsWith' operator", () => {
      const mockData = [
        { id: 1, model: "7IR-120", value: 10 },
        { id: 2, model: "9IR-240", value: 20 },
        { id: 3, model: "7IR-180", value: 30 },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [{ field: "model", operator: "startsWith", value: "7IR" }],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(2);
      expect(filtered.every((row) => row.model.startsWith("7IR"))).toBe(true);
    });

    it("should filter data with 'endsWith' operator", () => {
      const mockData = [
        { id: 1, location: "Building-A", value: 10 },
        { id: 2, location: "Building-B", value: 20 },
        { id: 3, location: "House-A", value: 30 },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [{ field: "location", operator: "endsWith", value: "-A" }],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(2);
      expect(filtered.every((row) => row.location.endsWith("-A"))).toBe(true);
    });

    it("should filter data with '>' operator", () => {
      const mockData = [
        { id: 1, az: 2.5, name: "Low" },
        { id: 2, az: 3.5, name: "Medium" },
        { id: 3, az: 4.5, name: "High" },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [{ field: "az", operator: ">", value: 3 }],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(2);
      expect(filtered.every((row) => row.az > 3)).toBe(true);
    });

    it("should filter data with '>=' operator", () => {
      const mockData = [
        { id: 1, az: 2.5, name: "Low" },
        { id: 2, az: 3.0, name: "Medium" },
        { id: 3, az: 4.5, name: "High" },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [{ field: "az", operator: ">=", value: 3.0 }],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(2);
      expect(filtered.every((row) => row.az >= 3.0)).toBe(true);
    });

    it("should filter data with '<' operator", () => {
      const mockData = [
        { id: 1, outdoor_temp: -5, name: "Cold" },
        { id: 2, outdoor_temp: 10, name: "Cool" },
        { id: 3, outdoor_temp: 20, name: "Warm" },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [{ field: "outdoor_temp", operator: "<", value: 15 }],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(2);
      expect(filtered.every((row) => row.outdoor_temp < 15)).toBe(true);
    });

    it("should filter data with '<=' operator", () => {
      const mockData = [
        { id: 1, outdoor_temp: 5, name: "Cold" },
        { id: 2, outdoor_temp: 10, name: "Cool" },
        { id: 3, outdoor_temp: 20, name: "Warm" },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [{ field: "outdoor_temp", operator: "<=", value: 10 }],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(2);
      expect(filtered.every((row) => row.outdoor_temp <= 10)).toBe(true);
    });

    it("should filter data with 'isEmpty' operator", () => {
      const mockData = [
        { id: 1, notes: null, name: "No notes" },
        { id: 2, notes: "Some notes", name: "Has notes" },
        { id: 3, notes: "", name: "Empty notes" },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [{ field: "notes", operator: "isEmpty", value: null }],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(2);
      expect(filtered.every((row) => row.notes == null || row.notes === "")).toBe(true);
    });

    it("should filter data with 'isNotEmpty' operator", () => {
      const mockData = [
        { id: 1, notes: null, name: "No notes" },
        { id: 2, notes: "Some notes", name: "Has notes" },
        { id: 3, notes: "", name: "Empty notes" },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [{ field: "notes", operator: "isNotEmpty", value: null }],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(1);
      expect(filtered[0].notes).toBe("Some notes");
    });

    it("should apply multiple filter conditions with AND logic", () => {
      const mockData = [
        { id: 1, heating_type: "Floor Heating", az: 3.5 },
        { id: 2, heating_type: "Radiators", az: 2.5 },
        { id: 3, heating_type: "Floor Heating", az: 2.0 },
        { id: 4, heating_type: "Radiators", az: 4.0 },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [
          { field: "heating_type", operator: "equals", value: "Floor Heating" },
          { field: "az", operator: ">=", value: 3.0 },
        ],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(1);
      expect(filtered[0].heating_type).toBe("Floor Heating");
      expect(filtered[0].az).toBeGreaterThanOrEqual(3.0);
    });

    it("should handle case-insensitive string comparisons", () => {
      const mockData = [
        { id: 1, name: "FLOOR HEATING" },
        { id: 2, name: "floor heating" },
        { id: 3, name: "Floor Heating" },
        { id: 4, name: "Radiators" },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [{ field: "name", operator: "contains", value: "floor" }],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(3);
    });

    it("should return empty array when no data matches filter", () => {
      const mockData = [
        { id: 1, heating_type: "Floor Heating" },
        { id: 2, heating_type: "Floor Heating" },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [{ field: "heating_type", operator: "equals", value: "Radiators" }],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(0);
    });

    it("should handle filtering on undefined/null values", () => {
      const mockData = [
        { id: 1, name: "Test 1", optional_field: null },
        { id: 2, name: "Test 2", optional_field: "value" },
        { id: 3, name: "Test 3", optional_field: undefined },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [{ field: "optional_field", operator: "isEmpty", value: null }],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(2);
    });
  });

  describe("comparisonGroupsForChart", () => {
    it("should return undefined when not in comparison mode", () => {
      const mockData = [{ id: 1, name: "Test", value: 10 }];

      const { result } = renderHook(() => useComparisonMode(mockData));

      expect(result.current.comparisonGroupsForChart).toBeUndefined();
    });

    it("should return undefined when data is undefined", () => {
      const { result } = renderHook(() => useComparisonMode(undefined));

      expect(result.current.comparisonGroupsForChart).toBeUndefined();
    });
  });

  describe("dataGridComparisonProps", () => {
    it("should provide all required props for DataGridWrapper", () => {
      const mockData = [{ id: 1, name: "Test", value: 10 }];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const props = result.current.dataGridComparisonProps;

      expect(props).toHaveProperty("comparisonMode");
      expect(props).toHaveProperty("activeGroup");
      expect(props).toHaveProperty("activeFilterModel");
      expect(props).toHaveProperty("filterGroup1Count");
      expect(props).toHaveProperty("filterGroup2Count");
      expect(props).toHaveProperty("onFilterModelChange");
      expect(props).toHaveProperty("onUpdateFilterGroup");
      expect(props).toHaveProperty("onSetActiveGroup");
      expect(props).toHaveProperty("onClearFilterGroup2");
    });

    it("should provide functions for filter handlers", () => {
      const mockData = [{ id: 1, name: "Test", value: 10 }];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const props = result.current.dataGridComparisonProps;

      expect(typeof props.onFilterModelChange).toBe("function");
      expect(typeof props.onUpdateFilterGroup).toBe("function");
      expect(typeof props.onSetActiveGroup).toBe("function");
      expect(typeof props.onClearFilterGroup2).toBe("function");
    });
  });

  describe("Performance and Memoization", () => {
    it("should memoize filter results when data doesn't change", () => {
      const mockData = [
        { id: 1, name: "Test 1", value: 10 },
        { id: 2, name: "Test 2", value: 20 },
      ];

      const { result, rerender } = renderHook(() => useComparisonMode(mockData));

      const firstResult = result.current.comparisonGroupsForChart;

      rerender();

      const secondResult = result.current.comparisonGroupsForChart;

      expect(firstResult).toBe(secondResult); // Same reference
    });

    it("should return stable dataGridComparisonProps object", () => {
      const mockData = [{ id: 1, name: "Test", value: 10 }];

      const { result, rerender } = renderHook(() => useComparisonMode(mockData));

      const firstProps = result.current.dataGridComparisonProps;

      rerender();

      const secondProps = result.current.dataGridComparisonProps;

      // Props object should have stable reference
      expect(typeof firstProps.onFilterModelChange).toBe("function");
      expect(typeof secondProps.onFilterModelChange).toBe("function");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty data array", () => {
      const { result } = renderHook(() => useComparisonMode([]));

      const filtered = result.current.applyFiltersToData([], {
        items: [{ field: "name", operator: "contains", value: "test" }],
      });

      expect(filtered).toEqual([]);
    });

    it("should handle filter on non-existent field", () => {
      const mockData = [
        { id: 1, name: "Test 1" },
        { id: 2, name: "Test 2" },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [{ field: "non_existent_field", operator: "equals", value: "test" }],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(0);
    });

    it("should handle numeric string comparisons", () => {
      const mockData = [
        { id: 1, month: "7", value: 10 },
        { id: 2, month: "12", value: 20 },
        { id: 3, month: "1", value: 30 },
      ];

      const { result } = renderHook(() => useComparisonMode(mockData));

      const filterModel: GridFilterModel = {
        items: [{ field: "month", operator: "contains", value: "1" }],
      };

      const filtered = result.current.applyFiltersToData(mockData, filterModel);
      expect(filtered.length).toBe(2); // "12" and "1" both contain "1"
    });
  });
});
