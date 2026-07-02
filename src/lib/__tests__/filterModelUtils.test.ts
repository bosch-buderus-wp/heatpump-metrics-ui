import { type GridFilterModel, GridLogicOperator } from "@mui/x-data-grid";
import { describe, expect, it } from "vitest";
import { applyGridFilterModel, countActiveFilterItems } from "../filterModelUtils";

const rows = [
  { id: 1, type: "floor", cop: 4.2 },
  { id: 2, type: "floor", cop: 3.1 },
  { id: 3, type: "radiator", cop: 4.5 },
];
const resolveValue = (row: Record<string, unknown>, field: string) => row[field];

describe("filterModelUtils", () => {
  it("combines multiple active criteria with AND", () => {
    const model: GridFilterModel = {
      logicOperator: GridLogicOperator.And,
      items: [
        { id: 1, field: "type", operator: "equals", value: "floor" },
        { id: 2, field: "cop", operator: ">", value: 4 },
      ],
    };

    expect(applyGridFilterModel(rows, model, resolveValue)).toEqual([rows[0]]);
  });

  it("returns an empty result when no row matches", () => {
    const model: GridFilterModel = {
      items: [{ id: 1, field: "cop", operator: ">", value: 10 }],
    };

    expect(applyGridFilterModel(rows, model, resolveValue)).toEqual([]);
  });

  it("does not count incomplete filter rows", () => {
    const model: GridFilterModel = {
      items: [
        { id: 1, field: "type", operator: "equals", value: "" },
        { id: 2, field: "cop", operator: ">", value: 4 },
      ],
    };

    expect(countActiveFilterItems(model)).toBe(1);
  });
});
