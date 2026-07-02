import { type GridApiCommon, gridFilteredSortedRowIdsSelector } from "@mui/x-data-grid";
import { useCallback, useEffect, useRef, useState } from "react";

interface GridFilterModel {
  items: Array<{
    field: string;
    operator: string;
    value?: unknown;
  }>;
}

/**
 * Custom hook to sync filtered DataGrid rows with external state (e.g., for charts)
 * @param apiRef - MUI DataGrid API reference
 * @param sourceData - The original data array
 * @returns [filteredData, handleFilterModelChange] - Filtered data and filter change handler
 */
export function useDataGridFilter<T>(
  apiRef: React.MutableRefObject<GridApiCommon>,
  sourceData: T[],
  getRowId: (row: T) => string | number,
): [T[], (model: GridFilterModel) => void] {
  const [filteredData, setFilteredData] = useState<T[]>([]);
  const [filterVersion, setFilterVersion] = useState(0);
  const filterUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getRowIdRef = useRef(getRowId);
  getRowIdRef.current = getRowId;

  const handleFilterModelChange = useCallback((_model: GridFilterModel) => {
    // MUI emits the model change before its internal filtered-row state is
    // committed. Read the row IDs in the next task so chart consumers receive
    // the same rows that are already visible in the grid.
    if (filterUpdateTimerRef.current) {
      clearTimeout(filterUpdateTimerRef.current);
    }
    filterUpdateTimerRef.current = setTimeout(() => {
      setFilterVersion((version) => version + 1);
      filterUpdateTimerRef.current = null;
    }, 0);
  }, []);

  useEffect(
    () => () => {
      if (filterUpdateTimerRef.current) {
        clearTimeout(filterUpdateTimerRef.current);
      }
    },
    [],
  );

  // Update filtered data when filter changes or source data changes
  useEffect(() => {
    if (apiRef.current && sourceData.length > 0) {
      try {
        // Get filtered and sorted row IDs from DataGrid
        const filteredRowIds = gridFilteredSortedRowIdsSelector(apiRef);
        const sourceRowsById = new Map(
          sourceData.map((row) => [getRowIdRef.current(row), row] as const),
        );

        const visibleRows: T[] = [];
        for (const id of filteredRowIds) {
          const row = sourceRowsById.get(id) ?? apiRef.current?.getRow(id);
          if (row) {
            visibleRows.push(row as T);
          }
        }

        setFilteredData(visibleRows);
      } catch {
        // If DataGrid is not ready, fall back to source data
        setFilteredData(sourceData);
      }
    } else if (sourceData.length > 0) {
      setFilteredData(sourceData);
    } else {
      setFilteredData([]);
    }
  }, [filterVersion, sourceData, apiRef]);

  return [filteredData, handleFilterModelChange];
}
