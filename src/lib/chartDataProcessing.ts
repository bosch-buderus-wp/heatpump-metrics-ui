/**
 * Chart data processing utilities.
 * Handles aggregation, formatting, and transformation of data for charts.
 */

import type { ChartDataRow } from "../components/common/charts/AzBarChart";
import { robustLinearRegression } from "./regressionUtils";

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

/**
 * Calculate AZ (Arbeitszahl) from thermal and electrical energy
 */
export interface SystemAzData {
  heatingId: string;
  az: number | null;
  azHeating: number | null;
  thermalTotal: number;
  electricalTotal: number;
  thermalHeatingTotal: number;
  electricalHeatingTotal: number;
}

export function calculateSystemAz<
  T extends {
    heating_id: string;
    thermal_energy_kwh?: number | null;
    electrical_energy_kwh?: number | null;
    thermal_energy_heating_kwh?: number | null;
    electrical_energy_heating_kwh?: number | null;
  },
>(data: T[]): SystemAzData[] {
  // Group data by heating_id and sum energy values
  const systemTotals = new Map<
    string,
    {
      thermal: number;
      electrical: number;
      thermalHeating: number;
      electricalHeating: number;
    }
  >();

  data.forEach((row) => {
    const heatingId = row.heating_id;
    const existing = systemTotals.get(heatingId) || {
      thermal: 0,
      electrical: 0,
      thermalHeating: 0,
      electricalHeating: 0,
    };

    existing.thermal += row.thermal_energy_kwh || 0;
    existing.electrical += row.electrical_energy_kwh || 0;
    existing.thermalHeating += row.thermal_energy_heating_kwh || 0;
    existing.electricalHeating += row.electrical_energy_heating_kwh || 0;

    systemTotals.set(heatingId, existing);
  });

  // Calculate AZ for each system
  return Array.from(systemTotals.entries()).map(([heatingId, totals]) => ({
    heatingId,
    az: totals.electrical > 0 ? totals.thermal / totals.electrical : null,
    azHeating:
      totals.electricalHeating > 0 ? totals.thermalHeating / totals.electricalHeating : null,
    thermalTotal: totals.thermal,
    electricalTotal: totals.electrical,
    thermalHeatingTotal: totals.thermalHeating,
    electricalHeatingTotal: totals.electricalHeating,
  }));
}

/**
 * Calculate daily TAZ (Tagesarbeitszahl) from cumulative measurement readings
 * For measurements table: calculates difference between last and first reading of the day
 */
export function calculateDailyTaz<
  T extends {
    heating_id: string;
    thermal_energy_kwh?: number | null;
    electrical_energy_kwh?: number | null;
    thermal_energy_heating_kwh?: number | null;
    electrical_energy_heating_kwh?: number | null;
    created_at?: string | null;
  },
>(data: T[]): SystemAzData[] {
  // Group data by heating_id
  const systemData = new Map<string, T[]>();

  data.forEach((row) => {
    const heatingId = row.heating_id;
    if (!systemData.has(heatingId)) {
      systemData.set(heatingId, []);
    }
    systemData.get(heatingId)?.push(row);
  });

  // Calculate TAZ for each system using difference between last and first measurement
  return Array.from(systemData.entries()).map(([heatingId, measurements]) => {
    if (measurements.length === 0) {
      return {
        heatingId,
        az: null,
        azHeating: null,
        thermalTotal: 0,
        electricalTotal: 0,
        thermalHeatingTotal: 0,
        electricalHeatingTotal: 0,
      };
    }

    // Sort by timestamp to ensure correct order
    const sorted = [...measurements].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    // Calculate differences (last - first)
    const thermalDiff = (last.thermal_energy_kwh || 0) - (first.thermal_energy_kwh || 0);
    const electricalDiff = (last.electrical_energy_kwh || 0) - (first.electrical_energy_kwh || 0);
    const thermalHeatingDiff =
      (last.thermal_energy_heating_kwh || 0) - (first.thermal_energy_heating_kwh || 0);
    const electricalHeatingDiff =
      (last.electrical_energy_heating_kwh || 0) - (first.electrical_energy_heating_kwh || 0);

    return {
      heatingId,
      az: electricalDiff > 0 ? thermalDiff / electricalDiff : null,
      azHeating: electricalHeatingDiff > 0 ? thermalHeatingDiff / electricalHeatingDiff : null,
      thermalTotal: thermalDiff,
      electricalTotal: electricalDiff,
      thermalHeatingTotal: thermalHeatingDiff,
      electricalHeatingTotal: electricalHeatingDiff,
    };
  });
}

/**
 * Create histogram bins from AZ values
 */
export interface HistogramBin {
  binLabel: string;
  binStart: number;
  binEnd: number;
  count: number;
  countHeating: number;
  systemIds: string[];
  systemIdsHeating?: string[];
}

export interface HistogramStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  count: number;
}

/**
 * Compute regression for AZ vs temperature data.
 * Filters valid points and applies robust linear regression.
 */
export function computeAzTemperatureRegression(
  data: Array<{ x: number; y: number }>,
): ReturnType<typeof robustLinearRegression> {
  // Filter valid points (positive AZ, finite values)
  const validPoints = data.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.y > 0);

  if (validPoints.length < 2) {
    return null;
  }

  return robustLinearRegression(validPoints);
}

export function createHistogramBins(
  systemData: SystemAzData[],
  azField: "az" | "azHeating" = "az",
  binSize = 0.5,
): { bins: HistogramBin[]; stats: HistogramStats } {
  // Filter out null values and extract AZ values
  const validData = systemData
    .filter((d) => d[azField] !== null)
    .map((d) => ({ heatingId: d.heatingId, value: d[azField] as number }));

  if (validData.length === 0) {
    return {
      bins: [],
      stats: { mean: 0, median: 0, min: 0, max: 0, count: 0 },
    };
  }

  const values = validData.map((d) => d.value);

  // Calculate statistics
  const sortedValues = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const median = sortedValues[Math.floor(sortedValues.length / 2)];
  const min = sortedValues[0];
  const max = sortedValues[sortedValues.length - 1];

  // Determine bin range
  const minBin = Math.floor(min / binSize) * binSize;
  const maxBin = Math.ceil(max / binSize) * binSize;

  // Create bins
  const binsMap = new Map<string, { start: number; end: number; systemIds: string[] }>();

  for (let binStart = minBin; binStart < maxBin; binStart += binSize) {
    const binEnd = binStart + binSize;
    const binLabel = `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`;
    binsMap.set(binLabel, { start: binStart, end: binEnd, systemIds: [] });
  }

  // Assign systems to bins
  validData.forEach(({ heatingId, value }) => {
    const binStart = Math.floor(value / binSize) * binSize;
    const binEnd = binStart + binSize;
    const binLabel = `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`;

    const bin = binsMap.get(binLabel);
    if (bin) {
      bin.systemIds.push(heatingId);
    }
  });

  // Convert to array format
  const bins: HistogramBin[] = Array.from(binsMap.entries())
    .map(([binLabel, bin]) => ({
      binLabel,
      binStart: bin.start,
      binEnd: bin.end,
      count: bin.systemIds.length,
      countHeating: 0, // Will be set separately when combining az and azHeating
      systemIds: bin.systemIds,
      systemIdsHeating: [],
    }))
    .filter((bin) => bin.count > 0); // Only include bins with data

  return {
    bins,
    stats: { mean, median, min, max, count: validData.length },
  };
}
