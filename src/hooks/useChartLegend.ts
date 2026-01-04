import { useCallback, useMemo, useState } from "react";
import type { ComparisonDataGroup } from "../components/common/charts/AzBarChart";
import { CHART_COLORS } from "../lib/chartTheme";

interface LegendItem {
  id: string;
  label: string;
  color: string;
}

interface UseChartLegendOptions {
  azTotalKey: string;
  azHeatingKey: string;
  barColor?: string;
  isComparisonMode?: boolean;
  comparisonGroups?: ComparisonDataGroup[];
  outdoorTempLabel: string;
  flowTempLabel: string;
  clickableIds?: string[]; // Optional: restrict which legend items are clickable (default: all)
  showTemperatureLines?: boolean; // Optional: whether to show temperature line legend items (default: true)
}

/**
 * Hook to manage chart legend state and generation
 */
export function useChartLegend(options: UseChartLegendOptions) {
  const {
    azTotalKey,
    azHeatingKey,
    barColor = CHART_COLORS.primary,
    isComparisonMode = false,
    comparisonGroups,
    outdoorTempLabel,
    flowTempLabel,
    clickableIds,
    showTemperatureLines = true,
  } = options;

  const [activeKey, setActiveKey] = useState<string>("");
  const [showOutdoorTemp, setShowOutdoorTemp] = useState<boolean>(true);
  const [showFlowTemp, setShowFlowTemp] = useState<boolean>(true);

  const currentActiveKey = activeKey || azHeatingKey;

  // Handle legend item clicks
  const handleLegendClick = useCallback(
    (datum: { id: string }) => {
      const id = typeof datum.id === "string" ? datum.id : String(datum.id);

      // If clickableIds is specified, only handle clicks for those IDs
      if (clickableIds && !clickableIds.includes(id)) {
        return;
      }

      // Handle temperature line toggles
      if (id === "outdoor_temp") {
        setShowOutdoorTemp((prev) => !prev);
        return;
      }
      if (id === "flow_temp") {
        setShowFlowTemp((prev) => !prev);
        return;
      }
      // Toggle to the clicked key for AZ bars
      setActiveKey(id);
    },
    [clickableIds],
  );

  // Generate legend items based on mode
  const legendItems = useMemo<LegendItem[]>(() => {
    const items: LegendItem[] = [];

    // AZ toggle buttons
    items.push({
      id: azTotalKey,
      label: azTotalKey,
      color:
        currentActiveKey === azTotalKey
          ? isComparisonMode
            ? CHART_COLORS.primary
            : barColor
          : CHART_COLORS.inactive,
    });

    items.push({
      id: azHeatingKey,
      label: azHeatingKey,
      color:
        currentActiveKey === azHeatingKey
          ? isComparisonMode
            ? CHART_COLORS.primary
            : barColor
          : CHART_COLORS.inactive,
    });

    // Temperature lines (only if enabled)
    if (showTemperatureLines) {
      items.push({
        id: "outdoor_temp",
        label: outdoorTempLabel,
        color: showOutdoorTemp ? CHART_COLORS.outdoorTemp : CHART_COLORS.inactive,
      });

      items.push({
        id: "flow_temp",
        label: flowTempLabel,
        color: showFlowTemp ? CHART_COLORS.flowTemp : CHART_COLORS.inactive,
      });
    }

    return items;
  }, [
    azTotalKey,
    azHeatingKey,
    currentActiveKey,
    isComparisonMode,
    barColor,
    showOutdoorTemp,
    showFlowTemp,
    outdoorTempLabel,
    flowTempLabel,
    showTemperatureLines,
  ]);

  // Generate chart keys based on mode
  const chartKeys = useMemo<string[]>(() => {
    if (isComparisonMode && comparisonGroups) {
      // In comparison mode, use active key with group suffixes
      return comparisonGroups.map((group) => `${currentActiveKey} (${group.name})`);
    }

    // Normal mode: single key
    return [currentActiveKey];
  }, [isComparisonMode, comparisonGroups, currentActiveKey]);

  return {
    activeKey: currentActiveKey,
    showOutdoorTemp,
    showFlowTemp,
    chartKeys,
    legendItems,
    handleLegendClick,
  };
}
