import type { GridFilterModel } from "@mui/x-data-grid";
import { useCallback, useMemo } from "react";
import type { ChartDataRow, ComparisonDataGroup } from "../components/common/charts";
import type { FilterValueResolver } from "../lib/filterValueResolver";
import { useComparisonFilters } from "./useComparisonFilters";

/**
 * Custom hook that encapsulates all comparison mode logic.
 * Provides a clean API for pages to use comparison filtering without duplication.
 */
export function useComparisonMode<T extends Record<string, unknown>>(
  data: T[] | undefined,
  resolveFilterValue?: FilterValueResolver<T>,
) {
  const {
    filterGroup1,
    filterGroup2,
    activeGroup,
    setActiveGroup,
    comparisonMode,
    updateFilterGroup1,
    updateFilterGroup2,
    activeFilterModel,
    getComparisonGroups,
    clearFilterGroup2,
  } = useComparisonFilters();

  const resolveValue = useCallback(
    (row: T, field: string) => {
      if (resolveFilterValue) {
        const resolved = resolveFilterValue(row, field);
        // biome-ignore lint: Object.hasOwn is not available in the current TS lib target
        if (resolved !== undefined || Object.prototype.hasOwnProperty.call(row, field)) {
          return resolved;
        }
      }

      return row[field];
    },
    [resolveFilterValue],
  );

  // Apply filters to data based on filter model
  const applyFiltersToData = useCallback(
    (data: T[], filterModel: GridFilterModel): T[] => {
      if (!filterModel || filterModel.items.length === 0) return data;

      // Match DataGrid behavior: ignore incomplete items until user provides a value
      const activeItems = filterModel.items.filter((item) => {
        if (!item.field || !item.operator) return false;
        if (item.operator === "isEmpty" || item.operator === "isNotEmpty") return true;
        return item.value !== undefined && item.value !== null && item.value !== "";
      });

      if (activeItems.length === 0) return data;

      return data.filter((row) => {
        return activeItems.every((filterItem) => {
          const value = resolveValue(row, filterItem.field);

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
    },
    [resolveValue],
  );

  // Generate comparison groups for chart
  const comparisonGroupsForChart = useMemo<ComparisonDataGroup[] | undefined>(() => {
    if (!comparisonMode || !data) return undefined;

    const groups = getComparisonGroups();
    return groups.map((group) => ({
      id: String(group.id),
      name: group.name,
      color: group.color,
      data: applyFiltersToData(data, group.filterModel) as ChartDataRow[],
    }));
  }, [comparisonMode, data, getComparisonGroups, applyFiltersToData]);

  // Generate filtered data for single-filter mode (not in comparison mode)
  const filteredDataForChart = useMemo<ChartDataRow[] | undefined>(() => {
    if (comparisonMode || !data) return undefined;

    // Apply filter group 1 to the data
    return applyFiltersToData(data, filterGroup1) as ChartDataRow[];
  }, [comparisonMode, data, filterGroup1, applyFiltersToData]);

  // Handle filter model changes
  const handleFilterModelChange = useCallback(
    (model: GridFilterModel) => {
      if (activeGroup === 1) {
        updateFilterGroup1(model);
      } else {
        updateFilterGroup2(model);
      }
    },
    [activeGroup, updateFilterGroup1, updateFilterGroup2],
  );

  // Handle updating a specific filter group
  const handleUpdateFilterGroup = useCallback(
    (group: 1 | 2, model: GridFilterModel) => {
      if (group === 1) {
        updateFilterGroup1(model);
      } else {
        updateFilterGroup2(model);
      }
    },
    [updateFilterGroup1, updateFilterGroup2],
  );

  // Props to pass to DataGridWrapper
  const dataGridComparisonProps = useMemo(
    () => ({
      comparisonMode,
      activeGroup,
      activeFilterModel,
      filterGroup1Count: filterGroup1.items.length,
      filterGroup2Count: filterGroup2.items.length,
      onFilterModelChange: handleFilterModelChange,
      onUpdateFilterGroup: handleUpdateFilterGroup,
      onSetActiveGroup: setActiveGroup,
      onClearFilterGroup2: clearFilterGroup2,
    }),
    [
      comparisonMode,
      activeGroup,
      activeFilterModel,
      filterGroup1.items.length,
      filterGroup2.items.length,
      handleFilterModelChange,
      handleUpdateFilterGroup,
      setActiveGroup,
      clearFilterGroup2,
    ],
  );

  return {
    comparisonMode,
    comparisonGroupsForChart,
    filteredDataForChart,
    dataGridComparisonProps,
    applyFiltersToData,
  };
}
