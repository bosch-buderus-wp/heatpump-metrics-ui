import type { GridFilterModel } from "@mui/x-data-grid";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useComparisonFilters } from "../useComparisonFilters";

describe("useComparisonFilters", () => {
  it("should initialize with empty filter groups", () => {
    const { result } = renderHook(() => useComparisonFilters());

    expect(result.current.filterGroup1.items).toHaveLength(0);
    expect(result.current.filterGroup2.items).toHaveLength(0);
    expect(result.current.activeGroup).toBe(1);
    expect(result.current.comparisonMode).toBe(false);
  });

  it("should activate comparison mode when filter group 2 has filters", () => {
    const { result } = renderHook(() => useComparisonFilters());

    // Initially not in comparison mode
    expect(result.current.comparisonMode).toBe(false);

    // Add a filter to group 2
    act(() => {
      result.current.updateFilterGroup2({
        items: [{ field: "heating_type", operator: "equals", value: "Floor Heating" }],
      });
    });

    // Should now be in comparison mode
    expect(result.current.comparisonMode).toBe(true);
  });

  it("should maintain independent filter models for each group", () => {
    const { result } = renderHook(() => useComparisonFilters());

    const filter1: GridFilterModel = {
      items: [{ field: "heating_type", operator: "equals", value: "Floor Heating" }],
    };

    const filter2: GridFilterModel = {
      items: [{ field: "heating_type", operator: "equals", value: "Radiators" }],
    };

    // Set filter for group 1
    act(() => {
      result.current.updateFilterGroup1(filter1);
    });

    // Set filter for group 2
    act(() => {
      result.current.updateFilterGroup2(filter2);
    });

    // Verify both groups have their own filters
    expect(result.current.filterGroup1.items).toHaveLength(1);
    expect(result.current.filterGroup1.items[0].value).toBe("Floor Heating");

    expect(result.current.filterGroup2.items).toHaveLength(1);
    expect(result.current.filterGroup2.items[0].value).toBe("Radiators");
  });

  it("should return correct active filter model based on active group", () => {
    const { result } = renderHook(() => useComparisonFilters());

    const filter1: GridFilterModel = {
      items: [{ field: "heating_type", operator: "equals", value: "Floor Heating" }],
    };

    const filter2: GridFilterModel = {
      items: [{ field: "heating_type", operator: "equals", value: "Radiators" }],
    };

    // Set filters for both groups
    act(() => {
      result.current.updateFilterGroup1(filter1);
      result.current.updateFilterGroup2(filter2);
    });

    // Active group is 1 by default
    expect(result.current.activeGroup).toBe(1);
    expect(result.current.activeFilterModel.items[0].value).toBe("Floor Heating");

    // Switch to group 2
    act(() => {
      result.current.setActiveGroup(2);
    });

    expect(result.current.activeGroup).toBe(2);
    expect(result.current.activeFilterModel.items[0].value).toBe("Radiators");

    // Switch back to group 1
    act(() => {
      result.current.setActiveGroup(1);
    });

    expect(result.current.activeGroup).toBe(1);
    expect(result.current.activeFilterModel.items[0].value).toBe("Floor Heating");
  });

  it("should simulate switching between groups and updating filters", () => {
    const { result } = renderHook(() => useComparisonFilters());

    // User is on group 1, sets a filter
    act(() => {
      result.current.updateFilterGroup1({
        items: [{ field: "flow_temperature_c", operator: "equals", value: 30 }],
      });
    });

    expect(result.current.filterGroup1.items[0].value).toBe(30);
    expect(result.current.activeFilterModel.items[0].value).toBe(30);

    // User switches to group 2
    act(() => {
      result.current.setActiveGroup(2);
    });

    // Group 2 should be empty initially
    expect(result.current.activeFilterModel.items).toHaveLength(0);

    // User sets a filter on group 2
    act(() => {
      result.current.updateFilterGroup2({
        items: [{ field: "flow_temperature_c", operator: "equals", value: 40 }],
      });
    });

    expect(result.current.filterGroup2.items[0].value).toBe(40);
    expect(result.current.activeFilterModel.items[0].value).toBe(40);

    // User switches back to group 1
    act(() => {
      result.current.setActiveGroup(1);
    });

    // Group 1 should still have its original filter
    expect(result.current.activeFilterModel.items[0].value).toBe(30);

    // Group 2 should still have its filter (not affected by switching)
    expect(result.current.filterGroup2.items[0].value).toBe(40);
  });

  it("should clear filter group 2 and exit comparison mode", () => {
    const { result } = renderHook(() => useComparisonFilters());

    // Set filters for both groups
    act(() => {
      result.current.updateFilterGroup1({
        items: [{ field: "heating_type", operator: "equals", value: "Floor Heating" }],
      });
      result.current.updateFilterGroup2({
        items: [{ field: "heating_type", operator: "equals", value: "Radiators" }],
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
    expect(result.current.filterGroup2.items).toHaveLength(0);
    expect(result.current.activeGroup).toBe(1);
  });

  it("should provide correct comparison groups for chart", () => {
    const { result } = renderHook(() => useComparisonFilters());

    // Set filters for both groups
    act(() => {
      result.current.updateFilterGroup1({
        items: [{ field: "heating_type", operator: "equals", value: "Floor Heating" }],
      });
      result.current.updateFilterGroup2({
        items: [{ field: "heating_type", operator: "equals", value: "Radiators" }],
      });
    });

    const groups = result.current.getComparisonGroups();

    expect(groups).toHaveLength(2);
    expect(groups[0].id).toBe(1);
    expect(groups[0].name).toBe("Filter 1");
    expect(groups[0].color).toBe("#23a477ff");
    expect(groups[0].filterModel.items[0].value).toBe("Floor Heating");

    expect(groups[1].id).toBe(2);
    expect(groups[1].name).toBe("Filter 2");
    expect(groups[1].color).toBe("#86efac");
    expect(groups[1].filterModel.items[0].value).toBe("Radiators");
  });
});
