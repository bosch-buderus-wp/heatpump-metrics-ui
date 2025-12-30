import { useState, useMemo } from "react";
import type { GridFilterModel } from "@mui/x-data-grid";

export interface ComparisonGroup {
  id: 1 | 2;
  name: string;
  color: string;
  filterModel: GridFilterModel;
}

export interface UseComparisonFiltersReturn {
  // Filter models
  filterGroup1: GridFilterModel;
  filterGroup2: GridFilterModel;

  // Active group in DataGrid
  activeGroup: 1 | 2;
  setActiveGroup: (group: 1 | 2) => void;

  // Comparison mode (auto-detected)
  comparisonMode: boolean;

  // Update filters
  updateFilterGroup1: (model: GridFilterModel) => void;
  updateFilterGroup2: (model: GridFilterModel) => void;

  // Get the active filter model for DataGrid
  activeFilterModel: GridFilterModel;

  // Helper to apply filters to data
  getComparisonGroups: () => ComparisonGroup[];

  // Clear a filter group
  clearFilterGroup2: () => void;
}

export const COMPARISON_COLORS = {
  group1: "#23a477ff", // Medium green
  group2: "#86efac", // Light green
  outdoor: "#3b82f6", // Blue (existing)
  flow: "#ef4444", // Red (existing)
};

export function useComparisonFilters(): UseComparisonFiltersReturn {
  const [filterGroup1, setFilterGroup1] = useState<GridFilterModel>({ items: [] });
  const [filterGroup2, setFilterGroup2] = useState<GridFilterModel>({ items: [] });
  const [activeGroup, setActiveGroup] = useState<1 | 2>(1);

  // Auto-detect comparison mode: active when group 2 has filters
  const comparisonMode = useMemo(() => {
    return filterGroup2.items.length > 0;
  }, [filterGroup2.items.length]);

  // Get the active filter model based on current active group
  const activeFilterModel = useMemo(() => {
    return activeGroup === 1 ? filterGroup1 : filterGroup2;
  }, [activeGroup, filterGroup1, filterGroup2]);

  // Get comparison groups for chart rendering
  const getComparisonGroups = (): ComparisonGroup[] => {
    const groups: ComparisonGroup[] = [
      {
        id: 1,
        name: "Filter 1",
        color: COMPARISON_COLORS.group1,
        filterModel: filterGroup1,
      },
    ];

    if (comparisonMode) {
      groups.push({
        id: 2,
        name: "Filter 2",
        color: COMPARISON_COLORS.group2,
        filterModel: filterGroup2,
      });
    }

    return groups;
  };

  // Clear filter group 2 (exits comparison mode)
  const clearFilterGroup2 = () => {
    setFilterGroup2({ items: [] });
    setActiveGroup(1);
  };

  return {
    filterGroup1,
    filterGroup2,
    activeGroup,
    setActiveGroup,
    comparisonMode,
    updateFilterGroup1: setFilterGroup1,
    updateFilterGroup2: setFilterGroup2,
    activeFilterModel,
    getComparisonGroups,
    clearFilterGroup2,
  };
}
