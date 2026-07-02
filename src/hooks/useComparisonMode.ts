import type { GridFilterModel } from "@mui/x-data-grid";
import { useCallback, useMemo } from "react";
import type { ChartDataRow, ComparisonDataGroup } from "../components/common/charts";
import { applyGridFilterModel, countActiveFilterItems } from "../lib/filterModelUtils";
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
      return applyGridFilterModel(data, filterModel, resolveValue);
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
      filterGroup1Count: countActiveFilterItems(filterGroup1),
      filterGroup2Count: countActiveFilterItems(filterGroup2),
      onFilterModelChange: handleFilterModelChange,
      onUpdateFilterGroup: handleUpdateFilterGroup,
      onSetActiveGroup: setActiveGroup,
      onClearFilterGroup2: clearFilterGroup2,
    }),
    [
      comparisonMode,
      activeGroup,
      activeFilterModel,
      filterGroup1,
      filterGroup2,
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
    activeFilterModel,
    dataGridComparisonProps,
    applyFiltersToData,
  };
}
