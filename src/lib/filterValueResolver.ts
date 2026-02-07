import type { GridColDef } from "@mui/x-data-grid";

export type FilterValueResolver<T> = (row: T, field: string) => unknown;

export function createFilterValueResolver<T extends Record<string, unknown>>(
  columns: GridColDef[],
): FilterValueResolver<T> {
  const columnsByField = new Map<string, GridColDef>();
  for (const column of columns) {
    columnsByField.set(column.field, column);
  }

  return (row, field) => {
    const rowValue = row[field];
    const column = columnsByField.get(field);

    if (column?.valueGetter) {
      const getter = column.valueGetter as unknown as (...args: unknown[]) => unknown;

      if (getter.length <= 1) {
        return getter(rowValue);
      }

      return getter(rowValue, row, column, null);
    }

    return rowValue;
  };
}
