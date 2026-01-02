import type { GridFilterModel } from "@mui/x-data-grid";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useComparisonFilters } from "../../../../hooks/useComparisonFilters";

/**
 * These tests verify the filter switching behavior
 */
describe("DataGridWrapper - Filter Switching Logic", () => {
  beforeEach(() => {
    // No mocks needed for this test
  });

  describe("Filter Group Switching", () => {
    it("should switch from group 1 to group 2 and maintain separate filter states", () => {
      const { result } = renderHook(() => useComparisonFilters());

      // Set filter on group 1
      const filter1: GridFilterModel = {
        items: [{ field: "name", operator: "contains", value: "test" }],
      };

      act(() => {
        result.current.updateFilterGroup1(filter1);
      });

      expect(result.current.activeGroup).toBe(1);
      expect(result.current.activeFilterModel.items).toHaveLength(1);
      expect(result.current.activeFilterModel.items[0].value).toBe("test");

      // Switch to group 2
      act(() => {
        result.current.setActiveGroup(2);
      });

      // Group 2 should have empty filters initially
      expect(result.current.activeGroup).toBe(2);
      expect(result.current.activeFilterModel.items).toHaveLength(0);

      // Set filter on group 2
      const filter2: GridFilterModel = {
        items: [{ field: "value", operator: ">=", value: 15 }],
      };

      act(() => {
        result.current.updateFilterGroup2(filter2);
      });

      // Group 2 should now have its filter
      expect(result.current.activeFilterModel.items).toHaveLength(1);
      expect(result.current.activeFilterModel.items[0].value).toBe(15);

      // Switch back to group 1
      act(() => {
        result.current.setActiveGroup(1);
      });

      // Group 1 should still have its original filter
      expect(result.current.activeGroup).toBe(1);
      expect(result.current.activeFilterModel.items).toHaveLength(1);
      expect(result.current.activeFilterModel.items[0].value).toBe("test");
    });

    it("should immediately reflect activeFilterModel when switching groups", () => {
      const { result } = renderHook(() => useComparisonFilters());

      // Setup filters for both groups
      act(() => {
        result.current.updateFilterGroup1({
          items: [{ field: "outdoor_temp", operator: "<", value: 0 }],
        });
        result.current.updateFilterGroup2({
          items: [{ field: "outdoor_temp", operator: ">", value: 20 }],
        });
      });

      // Start on group 1
      expect(result.current.activeGroup).toBe(1);
      expect(result.current.activeFilterModel.items[0].operator).toBe("<");
      expect(result.current.activeFilterModel.items[0].value).toBe(0);

      // Switch to group 2 - activeFilterModel should update immediately
      act(() => {
        result.current.setActiveGroup(2);
      });

      expect(result.current.activeGroup).toBe(2);
      expect(result.current.activeFilterModel.items[0].operator).toBe(">");
      expect(result.current.activeFilterModel.items[0].value).toBe(20);

      // Switch back to group 1 - should immediately show group 1 filters
      act(() => {
        result.current.setActiveGroup(1);
      });

      expect(result.current.activeGroup).toBe(1);
      expect(result.current.activeFilterModel.items[0].operator).toBe("<");
      expect(result.current.activeFilterModel.items[0].value).toBe(0);
    });
  });

  describe("Simulating the Bug Scenario", () => {
    it("should allow setting filters on group 2 and switching back to group 1 without losing group 2 filters", () => {
      const { result } = renderHook(() => useComparisonFilters());

      // User sets filter on group 1 (default)
      act(() => {
        result.current.updateFilterGroup1({
          items: [{ field: "heating_type", operator: "equals", value: "Floor Heating" }],
        });
      });

      expect(result.current.filterGroup1.items).toHaveLength(1);
      expect(result.current.comparisonMode).toBe(false);

      // User clicks on filter group 2 button
      act(() => {
        result.current.setActiveGroup(2);
      });

      expect(result.current.activeGroup).toBe(2);
      expect(result.current.activeFilterModel.items).toHaveLength(0);

      // User sets filter on group 2
      act(() => {
        result.current.updateFilterGroup2({
          items: [{ field: "heating_type", operator: "equals", value: "Radiators" }],
        });
      });

      // This is the key test: group 2 filter should be active immediately
      expect(result.current.activeFilterModel.items).toHaveLength(1);
      expect(result.current.activeFilterModel.items[0].value).toBe("Radiators");
      expect(result.current.comparisonMode).toBe(true);

      // Switch back to group 1
      act(() => {
        result.current.setActiveGroup(1);
      });

      expect(result.current.activeFilterModel.items[0].value).toBe("Floor Heating");

      // Switch to group 2 again - the bug was that filters wouldn't appear
      act(() => {
        result.current.setActiveGroup(2);
      });

      // Group 2 filters should still be there (this was the bug - they wouldn't show)
      expect(result.current.activeFilterModel.items).toHaveLength(1);
      expect(result.current.activeFilterModel.items[0].value).toBe("Radiators");
    });
  });

  describe("Comparison Mode Activation", () => {
    it("should enter comparison mode when group 2 has filters", () => {
      const { result } = renderHook(() => useComparisonFilters());

      expect(result.current.comparisonMode).toBe(false);

      act(() => {
        result.current.updateFilterGroup2({
          items: [{ field: "postal_code", operator: "contains", value: "12345" }],
        });
      });

      expect(result.current.comparisonMode).toBe(true);
    });

    it("should exit comparison mode when group 2 filters are cleared", () => {
      const { result } = renderHook(() => useComparisonFilters());

      // Set up comparison mode
      act(() => {
        result.current.updateFilterGroup1({
          items: [{ field: "az", operator: ">", value: 3 }],
        });
        result.current.updateFilterGroup2({
          items: [{ field: "az", operator: "<", value: 3 }],
        });
        result.current.setActiveGroup(2);
      });

      expect(result.current.comparisonMode).toBe(true);
      expect(result.current.activeGroup).toBe(2);

      // Clear group 2
      act(() => {
        result.current.clearFilterGroup2();
      });

      expect(result.current.comparisonMode).toBe(false);
      expect(result.current.activeGroup).toBe(1);
      expect(result.current.filterGroup2.items).toHaveLength(0);
    });
  });
});
