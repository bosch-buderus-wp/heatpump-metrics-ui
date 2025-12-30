import { useState, useCallback, useMemo } from "react";
import type { ComparisonDataGroup } from "../components/common/charts/AzBarChart";

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
}

/**
 * Hook to manage chart legend state and generation
 */
export function useChartLegend(options: UseChartLegendOptions) {
  const {
    azTotalKey,
    azHeatingKey,
    barColor = "#23a477ff",
    isComparisonMode = false,
    comparisonGroups,
    outdoorTempLabel,
    flowTempLabel,
  } = options;

  const [activeKey, setActiveKey] = useState<string>("");
  const [showOutdoorTemp, setShowOutdoorTemp] = useState<boolean>(true);
  const [showFlowTemp, setShowFlowTemp] = useState<boolean>(true);

  const currentActiveKey = activeKey || azHeatingKey;

  // Handle legend item clicks
  const handleLegendClick = useCallback((datum: { id: string }) => {
    // Handle temperature line toggles
    if (datum.id === "outdoor_temp") {
      setShowOutdoorTemp((prev) => !prev);
      return;
    }
    if (datum.id === "flow_temp") {
      setShowFlowTemp((prev) => !prev);
      return;
    }
    // Toggle to the clicked key for AZ bars
    setActiveKey(datum.id);
  }, []);

  // Generate legend items based on mode
  const legendItems = useMemo<LegendItem[]>(() => {
    const items: LegendItem[] = [];

    // AZ toggle buttons
    items.push({
      id: azTotalKey,
      label: azTotalKey,
      color:
        currentActiveKey === azTotalKey ? (isComparisonMode ? "#23a477ff" : barColor) : "#cccccc",
    });

    items.push({
      id: azHeatingKey,
      label: azHeatingKey,
      color:
        currentActiveKey === azHeatingKey ? (isComparisonMode ? "#23a477ff" : barColor) : "#cccccc",
    });

    // Temperature lines
    items.push({
      id: "outdoor_temp",
      label: outdoorTempLabel,
      color: showOutdoorTemp ? "#3b82f6" : "#cccccc",
    });

    items.push({
      id: "flow_temp",
      label: flowTempLabel,
      color: showFlowTemp ? "#ef4444" : "#cccccc",
    });

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
