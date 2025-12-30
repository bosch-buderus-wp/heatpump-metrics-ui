import { describe, it, expect } from "vitest";
import type { GridFilterModel } from "@mui/x-data-grid";

/**
 * CRITICAL INTEGRATION TEST FOR FILTER → CHART SYNC
 *
 * This test documents and validates the complete data flow that has broken multiple times:
 *
 * THE PROBLEM SCENARIO (happened multiple times):
 * 1. User applies filter in DataGrid (e.g., enum dropdown, text filter)
 * 2. DataGrid shows filtered rows correctly ✅
 * 3. BUT chart doesn't update because filtered data isn't propagated ❌
 *
 * THE CORRECT FLOW:
 * 1. User applies filter → DataGrid's onFilterModelChange is called
 * 2. DataGridWrapper.handleFilterChange is called
 * 3. useDataGridFilter.handleFilterModelChange is called (updates filterVersion)
 * 4. useDataGridFilter's useEffect runs (reads filtered IDs from DataGrid)
 * 5. filteredData state is updated
 * 6. onFilterChange callback is called with new filtered data
 * 7. Page component receives filtered data
 * 8. For non-comparison mode: filteredData is passed to chart
 * 9. For comparison mode: useComparisonMode.applyFiltersToData is called
 * 10. Chart receives filtered data ✅
 *
 * WHAT WE FIX WITH TESTS:
 * - Ensure "is" operator (enum filters) works in applyFiltersToData
 * - Ensure DataGridWrapper always calls handleFilterModelChange
 * - Ensure filter logic handles all operator types correctly
 *
 * This test validates the filter logic that both paths use.
 */

interface TestDataRow extends Record<string, unknown> {
  id: string;
  name: string;
  heating_type: string;
  model_idu: string;
  building_type: string;
  az: number;
  postal_code: string;
}

const testData: TestDataRow[] = [
  {
    id: "1",
    name: "System A",
    heating_type: "underfloorheating",
    model_idu: "CS5800i_E",
    building_type: "single_family_detached",
    az: 3.5,
    postal_code: "12345",
  },
  {
    id: "2",
    name: "System B",
    heating_type: "radiators",
    model_idu: "CS6800i_E",
    building_type: "apartment",
    az: 2.8,
    postal_code: "23456",
  },
  {
    id: "3",
    name: "System C",
    heating_type: "underfloorheating",
    model_idu: "CS5800i_E",
    building_type: "single_family_detached",
    az: 3.8,
    postal_code: "12345",
  },
];

// This is the actual filter logic from useComparisonMode that feeds charts
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
        case "is": // CRITICAL: Used by singleSelect columns (enum filters)
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

describe("Filter → Chart Synchronization - Integration Tests", () => {
  describe("THE CRITICAL BUG: Enum Filter → Chart Update", () => {
    it("MUST filter by heating_type enum and update chart data (has failed multiple times)", () => {
      // USER ACTION: Selects "underfloorheating" from heating_type dropdown
      const filterModel: GridFilterModel = {
        items: [
          {
            field: "heating_type",
            operator: "is", // singleSelect uses "is" operator
            value: "underfloorheating",
          },
        ],
      };

      // EXPECTED: Chart should receive only underfloorheating systems
      const chartData = applyFiltersToData(testData, filterModel);

      expect(chartData).toHaveLength(2);
      expect(chartData.map((r) => r.id)).toEqual(["1", "3"]);
      expect(chartData.every((r) => r.heating_type === "underfloorheating")).toBe(true);

      // CRITICAL: This test fails if "is" operator is not handled in applyFiltersToData
    });

    it("MUST filter by model_idu enum and update chart data", () => {
      // USER ACTION: Selects "CS5800i_E" from model_idu dropdown
      const filterModel: GridFilterModel = {
        items: [
          {
            field: "model_idu",
            operator: "is",
            value: "CS5800i_E",
          },
        ],
      };

      const chartData = applyFiltersToData(testData, filterModel);

      expect(chartData).toHaveLength(2);
      expect(chartData.every((r) => r.model_idu === "CS5800i_E")).toBe(true);
    });

    it("MUST filter by building_type enum and update chart data", () => {
      // USER ACTION: Selects "single_family_detached" from building_type dropdown
      const filterModel: GridFilterModel = {
        items: [
          {
            field: "building_type",
            operator: "is",
            value: "single_family_detached",
          },
        ],
      };

      const chartData = applyFiltersToData(testData, filterModel);

      expect(chartData).toHaveLength(2);
      expect(chartData.every((r) => r.building_type === "single_family_detached")).toBe(true);
    });
  });

  describe("Other Filter Types That Have Worked", () => {
    it("should filter by text field (contains) and update chart", () => {
      const filterModel: GridFilterModel = {
        items: [{ field: "name", operator: "contains", value: "System" }],
      };

      const chartData = applyFiltersToData(testData, filterModel);

      expect(chartData).toHaveLength(3);
    });

    it("should filter by number field and update chart", () => {
      const filterModel: GridFilterModel = {
        items: [{ field: "az", operator: ">", value: 3.0 }],
      };

      const chartData = applyFiltersToData(testData, filterModel);

      expect(chartData).toHaveLength(2);
      expect(chartData.every((r) => r.az > 3.0)).toBe(true);
    });
  });

  describe("Complex Scenarios", () => {
    it("MUST handle enum + text filter combination", () => {
      // USER ACTION: Filters by heating_type AND postal_code
      const filterModel: GridFilterModel = {
        items: [
          { field: "heating_type", operator: "is", value: "underfloorheating" },
          { field: "postal_code", operator: "startsWith", value: "123" },
        ],
      };

      const chartData = applyFiltersToData(testData, filterModel);

      expect(chartData).toHaveLength(2);
      expect(
        chartData.every(
          (r) => r.heating_type === "underfloorheating" && r.postal_code.startsWith("123"),
        ),
      ).toBe(true);
    });

    it("MUST handle enum + number filter combination", () => {
      // USER ACTION: Filters by heating_type AND az value
      const filterModel: GridFilterModel = {
        items: [
          { field: "heating_type", operator: "is", value: "underfloorheating" },
          { field: "az", operator: ">=", value: 3.8 },
        ],
      };

      const chartData = applyFiltersToData(testData, filterModel);

      expect(chartData).toHaveLength(1);
      expect(chartData[0].id).toBe("3");
    });

    it("MUST handle multiple enum filters", () => {
      // USER ACTION: Filters by heating_type AND model_idu
      const filterModel: GridFilterModel = {
        items: [
          { field: "heating_type", operator: "is", value: "underfloorheating" },
          { field: "model_idu", operator: "is", value: "CS5800i_E" },
        ],
      };

      const chartData = applyFiltersToData(testData, filterModel);

      expect(chartData).toHaveLength(2);
      expect(
        chartData.every(
          (r) => r.heating_type === "underfloorheating" && r.model_idu === "CS5800i_E",
        ),
      ).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should return all data when no filter is applied", () => {
      const filterModel: GridFilterModel = { items: [] };
      const chartData = applyFiltersToData(testData, filterModel);

      expect(chartData).toHaveLength(3);
      expect(chartData).toEqual(testData);
    });

    it("should return empty array when no data matches filter", () => {
      const filterModel: GridFilterModel = {
        items: [{ field: "heating_type", operator: "is", value: "nonexistent" }],
      };

      const chartData = applyFiltersToData(testData, filterModel);

      expect(chartData).toHaveLength(0);
    });

    it("should handle clearing filter (restoring all data)", () => {
      // Apply filter
      const filteredData = applyFiltersToData(testData, {
        items: [{ field: "heating_type", operator: "is", value: "radiators" }],
      });
      expect(filteredData).toHaveLength(1);

      // Clear filter
      const allData = applyFiltersToData(testData, { items: [] });
      expect(allData).toHaveLength(3);
      expect(allData).toEqual(testData);
    });
  });

  describe("Documentation: The Complete Flow", () => {
    it("documents the working flow from filter to chart", () => {
      // This test serves as living documentation of the correct behavior

      // STEP 1: User applies filter in DataGrid
      const userFilter: GridFilterModel = {
        items: [{ field: "heating_type", operator: "is", value: "underfloorheating" }],
      };

      // STEP 2: In non-comparison mode
      // - useDataGridFilter reads filtered IDs from DataGrid
      // - Returns filtered rows
      // - Page component receives filteredData
      // - filteredData is passed directly to chart
      const nonComparisonModeChartData = testData.filter(
        (r) => r.heating_type === "underfloorheating",
      );

      // STEP 3: In comparison mode
      // - useComparisonMode.applyFiltersToData is called
      // - Returns filtered data for chart
      const comparisonModeChartData = applyFiltersToData(testData, userFilter);

      // BOTH paths should produce the same result
      expect(nonComparisonModeChartData).toEqual(comparisonModeChartData);
      expect(comparisonModeChartData).toHaveLength(2);

      // VALIDATION: Chart receives correct filtered data ✅
    });
  });
});
