import { type GridApiCommon, gridFilteredSortedRowIdsSelector } from "@mui/x-data-grid";
import { useCallback, useEffect, useState } from "react";

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
): [T[], (model: GridFilterModel) => void] {
  const [filteredData, setFilteredData] = useState<T[]>([]);
  const [filterVersion, setFilterVersion] = useState(0);

  const handleFilterModelChange = useCallback((_model: GridFilterModel) => {
    // Trigger a re-filter by incrementing version
    setFilterVersion((v) => v + 1);
  }, []);

  // Update filtered data when filter changes or source data changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: filterVersion is intentionally used to trigger re-filtering
  useEffect(() => {
    if (apiRef.current && sourceData.length > 0) {
      try {
        // Get filtered and sorted row IDs from DataGrid
        const filteredRowIds = gridFilteredSortedRowIdsSelector(apiRef);

        const visibleRows: T[] = [];
        for (const id of filteredRowIds) {
          const row = apiRef.current?.getRow(id);
          if (row) {
            visibleRows.push(row as T);
          }
        }

        // Only update if we got valid filtered rows, otherwise use source data
        if (visibleRows.length > 0) {
          setFilteredData(visibleRows);
        } else {
          setFilteredData(sourceData);
        }
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
