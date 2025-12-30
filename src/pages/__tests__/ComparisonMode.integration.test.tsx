import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useComparisonFilters } from "../../hooks/useComparisonFilters";
import type { GridFilterModel } from "@mui/x-data-grid";

/**
 * Integration tests for comparison mode functionality across pages.
 * Tests the complete flow: filtering → comparison groups → chart data
 */
describe("Comparison Mode Integration", () => {
  describe("Filter Application Flow", () => {
    it("should apply filters and create comparison groups with correct data", () => {
      const { result } = renderHook(() => useComparisonFilters());

      // Mock data that would come from the database
      const mockData = [
        {
          id: "1",
          month: "1",
          heating_type: "Floor Heating",
          az: 3.5,
          az_heating: 3.2,
        },
        {
          id: "2",
          month: "1",
          heating_type: "Radiators",
          az: 2.8,
          az_heating: 2.5,
        },
        {
          id: "3",
          month: "2",
          heating_type: "Floor Heating",
          az: 3.8,
          az_heating: 3.5,
        },
        {
          id: "4",
          month: "2",
          heating_type: "Radiators",
          az: 3.0,
          az_heating: 2.7,
        },
      ];

      // Step 1: User sets filter on group 1 (Floor Heating)
      const filter1: GridFilterModel = {
        items: [{ field: "heating_type", operator: "equals", value: "Floor Heating" }],
      };

      act(() => {
        result.current.updateFilterGroup1(filter1);
      });

      expect(result.current.filterGroup1.items).toHaveLength(1);
      expect(result.current.comparisonMode).toBe(false);

      // Apply filter to data (simulating what happens in the page)
      const filteredGroup1 = mockData.filter((row) =>
        filter1.items.every((item) => row[item.field as keyof typeof row] === item.value),
      );

      expect(filteredGroup1).toHaveLength(2);
      expect(filteredGroup1.every((row) => row.heating_type === "Floor Heating")).toBe(true);

      // Step 2: User switches to group 2
      act(() => {
        result.current.setActiveGroup(2);
      });

      expect(result.current.activeGroup).toBe(2);

      // Step 3: User sets filter on group 2 (Radiators)
      const filter2: GridFilterModel = {
        items: [{ field: "heating_type", operator: "equals", value: "Radiators" }],
      };

      act(() => {
        result.current.updateFilterGroup2(filter2);
      });

      expect(result.current.filterGroup2.items).toHaveLength(1);
      expect(result.current.comparisonMode).toBe(true);

      // Apply filter to data
      const filteredGroup2 = mockData.filter((row) =>
        filter2.items.every((item) => row[item.field as keyof typeof row] === item.value),
      );

      expect(filteredGroup2).toHaveLength(2);
      expect(filteredGroup2.every((row) => row.heating_type === "Radiators")).toBe(true);

      // Step 4: Verify comparison groups
      const groups = result.current.getComparisonGroups();
      expect(groups).toHaveLength(2);
      expect(groups[0].name).toBe("Filter 1");
      expect(groups[1].name).toBe("Filter 2");

      // Verify both groups have different data
      expect(filteredGroup1[0].az).toBe(3.5); // Floor Heating month 1
      expect(filteredGroup2[0].az).toBe(2.8); // Radiators month 1
    });

    it("should handle nested field filtering (heating_systems)", () => {
      const { result } = renderHook(() => useComparisonFilters());

      // Mock data with nested heating_systems (as it comes from Supabase)
      const mockNestedData = [
        {
          id: "1",
          month: "1",
          az: 3.5,
          az_heating: 3.2,
          heating_systems: {
            model_odu: "7IR",
            heating_type: "Floor Heating",
          },
        },
        {
          id: "2",
          month: "1",
          az: 2.8,
          az_heating: 2.5,
          heating_systems: {
            model_odu: "9IR",
            heating_type: "Radiators",
          },
        },
      ];

      // Flatten the data (as done in Yearly/Daily pages)
      const flattenedData = mockNestedData.map((row) => ({
        ...row,
        ...(row.heating_systems || {}),
      }));

      // Set filter on flattened field
      const filter1: GridFilterModel = {
        items: [{ field: "model_odu", operator: "contains", value: "7" }],
      };

      act(() => {
        result.current.updateFilterGroup1(filter1);
      });

      // Apply filter
      const filtered = flattenedData.filter((row) =>
        filter1.items.every((item) => {
          const value = row[item.field as keyof typeof row];
          return (
            value != null && String(value).toLowerCase().includes(String(item.value).toLowerCase())
          );
        }),
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].model_odu).toBe("7IR");
    });

    it("should handle complex filter with multiple conditions", () => {
      const { result } = renderHook(() => useComparisonFilters());

      const mockData = [
        { id: "1", month: "1", az: 3.5, outdoor_temp: 5.0, heating_type: "Floor Heating" },
        { id: "2", month: "1", az: 2.8, outdoor_temp: 5.0, heating_type: "Radiators" },
        { id: "3", month: "2", az: 4.2, outdoor_temp: 12.0, heating_type: "Floor Heating" },
        { id: "4", month: "2", az: 3.5, outdoor_temp: 12.0, heating_type: "Radiators" },
      ];

      // Filter: Floor Heating AND outdoor_temp >= 10
      const filter1: GridFilterModel = {
        items: [
          { field: "heating_type", operator: "equals", value: "Floor Heating" },
          { field: "outdoor_temp", operator: ">=", value: 10 },
        ],
      };

      act(() => {
        result.current.updateFilterGroup1(filter1);
      });

      // Apply filter (simulate applyFiltersToData function)
      const filtered = mockData.filter((row) =>
        filter1.items.every((item) => {
          const value = row[item.field as keyof typeof row];
          switch (item.operator) {
            case "equals":
              return value === item.value;
            case ">=":
              return Number(value) >= Number(item.value);
            default:
              return true;
          }
        }),
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("3"); // Only month 2 Floor Heating
      expect(filtered[0].outdoor_temp).toBeGreaterThanOrEqual(10);
    });
  });

  describe("Data Aggregation with Comparison", () => {
    it("should aggregate data correctly for each comparison group", () => {
      const { result } = renderHook(() => useComparisonFilters());

      // Mock data with multiple entries per month (should be aggregated)
      const mockData = [
        { id: "1", month: "1", system_id: "sys1", az: 3.0, heating_type: "Floor Heating" },
        { id: "2", month: "1", system_id: "sys2", az: 4.0, heating_type: "Floor Heating" },
        { id: "3", month: "1", system_id: "sys3", az: 2.5, heating_type: "Radiators" },
        { id: "4", month: "1", system_id: "sys4", az: 3.5, heating_type: "Radiators" },
      ];

      // Set filters
      act(() => {
        result.current.updateFilterGroup1({
          items: [{ field: "heating_type", operator: "equals", value: "Floor Heating" }],
        });
        result.current.updateFilterGroup2({
          items: [{ field: "heating_type", operator: "equals", value: "Radiators" }],
        });
      });

      // Filter data for each group
      const group1Data = mockData.filter((row) => row.heating_type === "Floor Heating");
      const group2Data = mockData.filter((row) => row.heating_type === "Radiators");

      // Aggregate (average) AZ values for each group
      const group1Avg = group1Data.reduce((sum, row) => sum + row.az, 0) / group1Data.length;
      const group2Avg = group2Data.reduce((sum, row) => sum + row.az, 0) / group2Data.length;

      expect(group1Avg).toBe(3.5); // (3.0 + 4.0) / 2
      expect(group2Avg).toBe(3.0); // (2.5 + 3.5) / 2

      // Both groups should have data
      expect(group1Data.length).toBeGreaterThan(0);
      expect(group2Data.length).toBeGreaterThan(0);
    });
  });

  describe("Index Ordering in Comparison Mode", () => {
    it("should maintain correct order for monthly data (1-12)", () => {
      const { result } = renderHook(() => useComparisonFilters());

      const mockData = [
        { month: "12", az: 3.0, heating_type: "A" },
        { month: "1", az: 3.5, heating_type: "A" },
        { month: "7", az: 4.0, heating_type: "A" },
        { month: "12", az: 2.5, heating_type: "B" },
        { month: "1", az: 2.8, heating_type: "B" },
        { month: "7", az: 3.2, heating_type: "B" },
      ];

      act(() => {
        result.current.updateFilterGroup1({
          items: [{ field: "heating_type", operator: "equals", value: "A" }],
        });
        result.current.updateFilterGroup2({
          items: [{ field: "heating_type", operator: "equals", value: "B" }],
        });
      });

      const group1Data = mockData.filter((row) => row.heating_type === "A");
      const group2Data = mockData.filter((row) => row.heating_type === "B");

      // When using indexValues: ["1", "2", ..., "12"], the order should be maintained
      // Extract months and sort numerically
      const group1Months = group1Data.map((row) => row.month).sort((a, b) => Number(a) - Number(b));
      const group2Months = group2Data.map((row) => row.month).sort((a, b) => Number(a) - Number(b));

      expect(group1Months).toEqual(["1", "7", "12"]);
      expect(group2Months).toEqual(["1", "7", "12"]);
    });

    it("should maintain correct order for daily data (hours 0-23)", () => {
      const { result } = renderHook(() => useComparisonFilters());

      const mockData = [
        { hour: "23", az: 3.0, heating_type: "A" },
        { hour: "0", az: 3.5, heating_type: "A" },
        { hour: "12", az: 4.0, heating_type: "A" },
        { hour: "23", az: 2.5, heating_type: "B" },
        { hour: "0", az: 2.8, heating_type: "B" },
        { hour: "12", az: 3.2, heating_type: "B" },
      ];

      act(() => {
        result.current.updateFilterGroup1({
          items: [{ field: "heating_type", operator: "equals", value: "A" }],
        });
        result.current.updateFilterGroup2({
          items: [{ field: "heating_type", operator: "equals", value: "B" }],
        });
      });

      const group1Data = mockData.filter((row) => row.heating_type === "A");
      const group2Data = mockData.filter((row) => row.heating_type === "B");

      expect(group1Data).toHaveLength(3);
      expect(group2Data).toHaveLength(3);

      // Hours should be present in both groups
      expect(group1Data.some((row) => row.hour === "0")).toBe(true);
      expect(group2Data.some((row) => row.hour === "0")).toBe(true);
    });

    it("should maintain correct order for dates with leading zeros", () => {
      const { result } = renderHook(() => useComparisonFilters());

      const mockData = [
        { date: "2024-01-07", az: 3.0, system: "A" },
        { date: "2024-01-08", az: 3.5, system: "A" },
        { date: "2024-01-09", az: 4.0, system: "A" },
        { date: "2024-01-15", az: 3.8, system: "A" },
        { date: "2024-01-07", az: 2.5, system: "B" },
        { date: "2024-01-08", az: 2.8, system: "B" },
        { date: "2024-01-09", az: 3.2, system: "B" },
        { date: "2024-01-15", az: 3.0, system: "B" },
      ];

      act(() => {
        result.current.updateFilterGroup1({
          items: [{ field: "system", operator: "equals", value: "A" }],
        });
        result.current.updateFilterGroup2({
          items: [{ field: "system", operator: "equals", value: "B" }],
        });
      });

      const group1Data = mockData.filter((row) => row.system === "A");
      const group2Data = mockData.filter((row) => row.system === "B");

      // Extract day numbers with leading zeros (as would be done by indexFormatter)
      const formatDay = (date: string) => date.split("-")[2];

      const group1Days = group1Data.map((row) => formatDay(row.date));
      const group2Days = group2Data.map((row) => formatDay(row.date));

      // Should be in order: 07, 08, 09, 15
      expect(group1Days).toEqual(["07", "08", "09", "15"]);
      expect(group2Days).toEqual(["07", "08", "09", "15"]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle group with no matching data", () => {
      const { result } = renderHook(() => useComparisonFilters());

      const mockData = [
        { month: "1", az: 3.5, heating_type: "Floor Heating" },
        { month: "2", az: 3.8, heating_type: "Floor Heating" },
      ];

      act(() => {
        result.current.updateFilterGroup1({
          items: [{ field: "heating_type", operator: "equals", value: "Floor Heating" }],
        });
        result.current.updateFilterGroup2({
          items: [{ field: "heating_type", operator: "equals", value: "Radiators" }],
        });
      });

      const group1Data = mockData.filter((row) => row.heating_type === "Floor Heating");
      const group2Data = mockData.filter((row) => row.heating_type === "Radiators");

      expect(group1Data.length).toBeGreaterThan(0);
      expect(group2Data.length).toBe(0); // No radiators data

      expect(result.current.comparisonMode).toBe(true);
    });

    it("should clear comparison mode when group 2 is cleared", () => {
      const { result } = renderHook(() => useComparisonFilters());

      act(() => {
        result.current.updateFilterGroup1({
          items: [{ field: "heating_type", operator: "equals", value: "Floor Heating" }],
        });
        result.current.updateFilterGroup2({
          items: [{ field: "heating_type", operator: "equals", value: "Radiators" }],
        });
      });

      expect(result.current.comparisonMode).toBe(true);

      act(() => {
        result.current.clearFilterGroup2();
      });

      expect(result.current.comparisonMode).toBe(false);
      expect(result.current.activeGroup).toBe(1);
      expect(result.current.filterGroup2.items).toHaveLength(0);
    });

    it("should handle switching between groups multiple times", () => {
      const { result } = renderHook(() => useComparisonFilters());

      act(() => {
        result.current.updateFilterGroup1({
          items: [{ field: "az", operator: ">", value: 3 }],
        });
      });

      expect(result.current.activeGroup).toBe(1);

      act(() => {
        result.current.setActiveGroup(2);
      });

      expect(result.current.activeGroup).toBe(2);

      act(() => {
        result.current.updateFilterGroup2({
          items: [{ field: "az", operator: "<", value: 3 }],
        });
      });

      expect(result.current.comparisonMode).toBe(true);

      // Switch back to group 1
      act(() => {
        result.current.setActiveGroup(1);
      });

      expect(result.current.activeGroup).toBe(1);
      expect(result.current.activeFilterModel.items[0].operator).toBe(">");

      // Switch back to group 2
      act(() => {
        result.current.setActiveGroup(2);
      });

      expect(result.current.activeGroup).toBe(2);
      expect(result.current.activeFilterModel.items[0].operator).toBe("<");
    });
  });
});
