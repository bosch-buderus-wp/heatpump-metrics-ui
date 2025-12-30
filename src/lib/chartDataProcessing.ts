/**
 * Chart data processing utilities.
 * Handles aggregation, formatting, and transformation of data for charts.
 */

import type { ChartDataRow } from "../components/common/charts/AzBarChart";

interface AggregatedGroup {
  az_values: number[];
  az_heating_values: number[];
  outdoor_temp_values: number[];
  flow_temp_values: number[];
}

interface ProcessDatasetOptions {
  indexField: string;
  indexFormatter?: (value: string) => string;
  indexValues?: string[];
  azTotalKey: string;
  azHeatingKey: string;
  groupSuffix?: string;
  aggregateData?: boolean;
}

/**
 * Aggregates values for a single group of data
 */
function aggregateGroup(group: AggregatedGroup) {
  const azAvg =
    group.az_values.length > 0
      ? group.az_values.reduce((sum, val) => sum + val, 0) / group.az_values.length
      : 0;

  const azHeatingAvg =
    group.az_heating_values.length > 0
      ? group.az_heating_values.reduce((sum, val) => sum + val, 0) / group.az_heating_values.length
      : 0;

  const outdoorTempAvg =
    group.outdoor_temp_values.length > 0
      ? group.outdoor_temp_values.reduce((sum, val) => sum + val, 0) /
        group.outdoor_temp_values.length
      : null;

  const flowTempAvg =
    group.flow_temp_values.length > 0
      ? group.flow_temp_values.reduce((sum, val) => sum + val, 0) / group.flow_temp_values.length
      : null;

  return {
    azAvg: azAvg ? Number(azAvg.toFixed(2)) : 0,
    azHeatingAvg: azHeatingAvg ? Number(azHeatingAvg.toFixed(2)) : 0,
    outdoorTempAvg: outdoorTempAvg !== null ? Number(outdoorTempAvg.toFixed(2)) : null,
    flowTempAvg: flowTempAvg !== null ? Number(flowTempAvg.toFixed(2)) : null,
  };
}

/**
 * Groups raw data by index field for aggregation
 */
function groupDataByIndex(
  dataset: ChartDataRow[],
  indexField: string,
): Record<string, AggregatedGroup> {
  const grouped: Record<string, AggregatedGroup> = {};

  for (const row of dataset) {
    const indexValue = row[indexField];
    if (indexValue == null) continue;
    const key = String(indexValue);

    if (!grouped[key]) {
      grouped[key] = {
        az_values: [],
        az_heating_values: [],
        outdoor_temp_values: [],
        flow_temp_values: [],
      };
    }

    if (row.az !== undefined && row.az !== null && row.az > 0) {
      grouped[key].az_values.push(row.az);
    }
    if (row.az_heating !== undefined && row.az_heating !== null && row.az_heating > 0) {
      grouped[key].az_heating_values.push(row.az_heating);
    }
    if (row.outdoor_temperature_c !== undefined && row.outdoor_temperature_c !== null) {
      grouped[key].outdoor_temp_values.push(row.outdoor_temperature_c);
    }
    if (row.flow_temperature_c !== undefined && row.flow_temperature_c !== null) {
      grouped[key].flow_temp_values.push(row.flow_temperature_c);
    }
  }

  return grouped;
}

/**
 * Formats a single data point without aggregation
 */
function formatDataPoint(
  item: ChartDataRow,
  options: ProcessDatasetOptions,
): Record<string, unknown> {
  const { indexField, indexFormatter, azTotalKey, azHeatingKey, groupSuffix = "" } = options;

  const indexValue = item[indexField];
  const formattedIndex =
    indexFormatter && indexValue != null ? indexFormatter(String(indexValue)) : indexValue;

  return {
    [indexField]: formattedIndex,
    [`${azTotalKey}${groupSuffix}`]: item.az ? Number(item.az.toFixed(2)) : 0,
    [`${azHeatingKey}${groupSuffix}`]: item.az_heating ? Number(item.az_heating.toFixed(2)) : 0,
    outdoor_temp: item.outdoor_temperature_c ? Number(item.outdoor_temperature_c.toFixed(1)) : null,
    flow_temp: item.flow_temperature_c ? Number(item.flow_temperature_c.toFixed(1)) : null,
  };
}

/**
 * Processes a dataset: either direct mapping or aggregation
 */
export function processDataset(
  dataset: ChartDataRow[],
  options: ProcessDatasetOptions,
): Array<Record<string, unknown>> {
  if (!dataset || dataset.length === 0) return [];

  const {
    indexField,
    indexFormatter,
    indexValues,
    azTotalKey,
    azHeatingKey,
    groupSuffix = "",
    aggregateData = true,
  } = options;

  // Direct mapping without aggregation
  if (!aggregateData) {
    return dataset.map((item) => formatDataPoint(item, options));
  }

  // Aggregate data
  const grouped = groupDataByIndex(dataset, indexField);
  const indices = indexValues || Object.keys(grouped).sort();

  return indices.map((idx) => {
    const group = grouped[idx];

    // No data for this index
    if (!group || (group.az_values.length === 0 && group.az_heating_values.length === 0)) {
      return {
        [indexField]: indexFormatter ? indexFormatter(idx) : idx,
        [`${azTotalKey}${groupSuffix}`]: 0,
        [`${azHeatingKey}${groupSuffix}`]: 0,
        outdoor_temp: null,
        flow_temp: null,
      };
    }

    const { azAvg, azHeatingAvg, outdoorTempAvg, flowTempAvg } = aggregateGroup(group);

    return {
      [indexField]: indexFormatter ? indexFormatter(idx) : idx,
      [`${azTotalKey}${groupSuffix}`]: azAvg,
      [`${azHeatingKey}${groupSuffix}`]: azHeatingAvg,
      outdoor_temp: outdoorTempAvg,
      flow_temp: flowTempAvg,
    };
  });
}

/**
 * Merges multiple datasets for comparison mode
 */
export function mergeComparisonDatasets(
  groups: Array<{ name: string; data: ChartDataRow[] }>,
  options: Omit<ProcessDatasetOptions, "groupSuffix">,
): Array<Record<string, unknown>> {
  const { indexField, indexFormatter, indexValues, azTotalKey, azHeatingKey } = options;

  // Create combined data structure
  const combinedData: Record<string, Record<string, unknown>> = {};

  groups.forEach((group) => {
    const groupData = processDataset(group.data, {
      ...options,
      groupSuffix: ` (${group.name})`,
    });

    groupData.forEach((item) => {
      const idx = item[indexField];
      if (!idx) return;

      const indexKey = String(idx);
      if (!combinedData[indexKey]) {
        combinedData[indexKey] = { [indexField]: idx };
      }

      // Merge group data
      Object.assign(combinedData[indexKey], item);
    });
  });

  // Determine the correct order for indices
  let orderedIndices: string[];

  if (indexValues) {
    // Map indexValues through formatter to get the expected order
    orderedIndices = indexValues.map((val) => (indexFormatter ? indexFormatter(val) : val));
  } else {
    // Collect and sort indices from the data
    orderedIndices = Array.from(Object.keys(combinedData)).sort();
  }

  // Filter out entries with no data
  return orderedIndices
    .map((idx) => combinedData[idx])
    .filter(
      (d) =>
        d &&
        groups.some(
          (group) =>
            ((d[`${azTotalKey} (${group.name})`] as number) || 0) > 0 ||
            ((d[`${azHeatingKey} (${group.name})`] as number) || 0) > 0,
        ),
    );
}

/**
 * Calculate temperature scale for right Y-axis
 */
export function calculateTemperatureScale(chartData: Array<Record<string, unknown>>): {
  min: number;
  max: number;
} {
  if (!chartData || chartData.length === 0) return { min: 0, max: 40 };

  const allTemps: number[] = [];
  chartData.forEach((d) => {
    if (typeof d.outdoor_temp === "number") allTemps.push(d.outdoor_temp);
    if (typeof d.flow_temp === "number") allTemps.push(d.flow_temp);
  });

  if (allTemps.length === 0) return { min: 0, max: 40 };

  const min = Math.min(...allTemps);
  const max = Math.max(...allTemps);
  const padding = (max - min) * 0.1 || 5;

  return { min: Math.floor(min - padding), max: Math.ceil(max + padding) };
}
