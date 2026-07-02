import { type GridFilterItem, type GridFilterModel, GridLogicOperator } from "@mui/x-data-grid";
import type { FilterValueResolver } from "./filterValueResolver";

const VALUELESS_OPERATORS = new Set(["isEmpty", "isNotEmpty"]);

export function isFilterItemActive(item: GridFilterItem): boolean {
  if (!item.field || !item.operator) return false;
  if (VALUELESS_OPERATORS.has(item.operator)) return true;
  if (Array.isArray(item.value)) return item.value.length > 0;
  return item.value !== undefined && item.value !== null && item.value !== "";
}

export function countActiveFilterItems(model?: GridFilterModel | null): number {
  return model?.items.filter(isFilterItemActive).length ?? 0;
}

function matchesFilter(value: unknown, item: GridFilterItem): boolean {
  const filterValue = item.value;
  const text = value == null ? "" : String(value).toLowerCase();
  const filterText = filterValue == null ? "" : String(filterValue).toLowerCase();

  switch (item.operator) {
    case "contains":
      return value != null && text.includes(filterText);
    case "doesNotContain":
      return value == null || !text.includes(filterText);
    case "equals":
    case "is":
      return value === filterValue || String(value) === String(filterValue);
    case "doesNotEqual":
    case "not":
      return value !== filterValue && String(value) !== String(filterValue);
    case "startsWith":
      return value != null && text.startsWith(filterText);
    case "endsWith":
      return value != null && text.endsWith(filterText);
    case ">":
      return Number(value) > Number(filterValue);
    case ">=":
      return Number(value) >= Number(filterValue);
    case "<":
      return Number(value) < Number(filterValue);
    case "<=":
      return Number(value) <= Number(filterValue);
    case "isAnyOf":
      return (
        Array.isArray(filterValue) && filterValue.some((entry) => String(entry) === String(value))
      );
    case "isEmpty":
      return value == null || value === "";
    case "isNotEmpty":
      return value != null && value !== "";
    default:
      return true;
  }
}

export function applyGridFilterModel<T extends Record<string, unknown>>(
  data: T[],
  filterModel: GridFilterModel | null | undefined,
  resolveValue: FilterValueResolver<T>,
): T[] {
  const activeItems = filterModel?.items.filter(isFilterItemActive) ?? [];
  if (activeItems.length === 0) return data;

  const matchRow = (row: T) =>
    activeItems.map((item) => matchesFilter(resolveValue(row, item.field), item));

  if (filterModel?.logicOperator === GridLogicOperator.Or) {
    return data.filter((row) => matchRow(row).some(Boolean));
  }

  return data.filter((row) => matchRow(row).every(Boolean));
}
