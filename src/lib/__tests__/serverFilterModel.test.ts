import type { GridFilterModel } from "@mui/x-data-grid";
import { describe, expect, it } from "vitest";
import { sanitizeGridFilterModel } from "../serverFilterModel";

describe("sanitizeGridFilterModel", () => {
  it("maps aliased fields and normalizes scalar values", () => {
    const filterModel: GridFilterModel = {
      logicOperator: "and" as GridFilterModel["logicOperator"],
      items: [
        { field: "azHeating", operator: ">=", value: "4" },
        { field: "used_for_heating", operator: "is", value: "true" },
      ],
    };

    expect(sanitizeGridFilterModel(filterModel)).toEqual({
      logic: "and",
      items: [
        { field: "az_heating", operator: ">=", value: 4 },
        { field: "used_for_heating", operator: "is", value: true },
      ],
    });
  });

  it("drops incomplete filters but preserves empty-check operators", () => {
    const filterModel: GridFilterModel = {
      logicOperator: "or" as GridFilterModel["logicOperator"],
      items: [
        { field: "name", operator: "contains", value: "" },
        { field: "postal_code", operator: "isEmpty" },
      ],
    };

    expect(sanitizeGridFilterModel(filterModel)).toEqual({
      logic: "or",
      items: [{ field: "postal_code", operator: "isEmpty" }],
    });
  });

  it("normalizes array-based filters", () => {
    const filterModel: GridFilterModel = {
      items: [{ field: "building_construction_year", operator: "isAnyOf", value: ["1990", 2000] }],
    };

    expect(sanitizeGridFilterModel(filterModel)).toEqual({
      logic: "and",
      items: [
        {
          field: "building_construction_year",
          operator: "isAnyOf",
          value: [1990, 2000],
        },
      ],
    });
  });
});
