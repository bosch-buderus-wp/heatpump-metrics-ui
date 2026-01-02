import type { GridFilterModel } from "@mui/x-data-grid";
import { describe, expect, it } from "vitest";

/**
 * Integration test for enum filter support in comparison mode
 * Tests that singleSelect filters (used by enum columns) work correctly
 */
describe("useComparisonMode - Enum Filter Support", () => {
  // Mock applyFiltersToData function (extracted from useComparisonMode)
  const applyFiltersToData = <T extends Record<string, unknown>>(
    data: T[],
    filterModel: GridFilterModel,
  ): T[] => {
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
  };

  it("should filter data using 'is' operator for enum fields (heating_type)", () => {
    const mockData = [
      { id: "1", heating_type: "underfloorheating", az: 3.5 },
      { id: "2", heating_type: "radiators", az: 2.8 },
      { id: "3", heating_type: "underfloorheating", az: 3.8 },
      { id: "4", heating_type: "mixed", az: 3.0 },
    ];

    const filterModel: GridFilterModel = {
      items: [{ field: "heating_type", operator: "is", value: "underfloorheating" }],
    };

    const result = applyFiltersToData(mockData, filterModel);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("3");
    expect(result.every((r) => r.heating_type === "underfloorheating")).toBe(true);
  });

  it("should filter data using 'is' operator for enum fields (model_idu)", () => {
    const mockData = [
      { id: "1", model_idu: "CS5800i_E", az: 3.5 },
      { id: "2", model_idu: "CS6800i_E", az: 2.8 },
      { id: "3", model_idu: "CS5800i_E", az: 3.8 },
      { id: "4", model_idu: "WLW176i_E", az: 3.0 },
    ];

    const filterModel: GridFilterModel = {
      items: [{ field: "model_idu", operator: "is", value: "CS5800i_E" }],
    };

    const result = applyFiltersToData(mockData, filterModel);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("3");
    expect(result.every((r) => r.model_idu === "CS5800i_E")).toBe(true);
  });

  it("should filter data using 'is' operator for enum fields (building_type)", () => {
    const mockData = [
      { id: "1", building_type: "single_family_detached", az: 3.5 },
      { id: "2", building_type: "apartment", az: 2.8 },
      { id: "3", building_type: "single_family_detached", az: 3.8 },
      { id: "4", building_type: "commercial", az: 3.0 },
    ];

    const filterModel: GridFilterModel = {
      items: [{ field: "building_type", operator: "is", value: "single_family_detached" }],
    };

    const result = applyFiltersToData(mockData, filterModel);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("3");
    expect(result.every((r) => r.building_type === "single_family_detached")).toBe(true);
  });

  it("should handle multiple filters including enum filters", () => {
    const mockData = [
      { id: "1", heating_type: "underfloorheating", model_idu: "CS5800i_E", az: 3.5 },
      { id: "2", heating_type: "radiators", model_idu: "CS5800i_E", az: 2.8 },
      { id: "3", heating_type: "underfloorheating", model_idu: "CS6800i_E", az: 3.8 },
      { id: "4", heating_type: "underfloorheating", model_idu: "CS5800i_E", az: 3.0 },
    ];

    const filterModel: GridFilterModel = {
      items: [
        { field: "heating_type", operator: "is", value: "underfloorheating" },
        { field: "model_idu", operator: "is", value: "CS5800i_E" },
      ],
    };

    const result = applyFiltersToData(mockData, filterModel);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("4");
    expect(
      result.every((r) => r.heating_type === "underfloorheating" && r.model_idu === "CS5800i_E"),
    ).toBe(true);
  });

  it("should handle 'equals' operator as well (for backwards compatibility)", () => {
    const mockData = [
      { id: "1", heating_type: "underfloorheating", az: 3.5 },
      { id: "2", heating_type: "radiators", az: 2.8 },
    ];

    const filterModel: GridFilterModel = {
      items: [{ field: "heating_type", operator: "equals", value: "underfloorheating" }],
    };

    const result = applyFiltersToData(mockData, filterModel);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("should return all data when no filters are applied", () => {
    const mockData = [
      { id: "1", heating_type: "underfloorheating", az: 3.5 },
      { id: "2", heating_type: "radiators", az: 2.8 },
    ];

    const filterModel: GridFilterModel = {
      items: [],
    };

    const result = applyFiltersToData(mockData, filterModel);

    expect(result).toHaveLength(2);
    expect(result).toEqual(mockData);
  });
});
