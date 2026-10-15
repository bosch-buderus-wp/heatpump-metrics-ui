/**
 * Data quality validation utilities
 * Identifies unrealistic or suspicious data in heat pump measurements
 */

export interface DataQualityIssue {
  type: "unrealistic_cop" | "negative_value";
  message: string;
  severity: "error" | "warning";
  // Additional data for translation
  translationKey?: string;
  translationParams?: Record<string, number | string>;
}

export interface DataQualityResult {
  isValid: boolean;
  issues: DataQualityIssue[];
}

/**
 * Realistic COP ranges for heat pumps
 * Values outside this range are almost certainly measurement errors
 */
const COP_THRESHOLDS = {
  MAX_REALISTIC: 10.0,
  MIN_REALISTIC: 0.0,
};

/**
 * Check if a COP value is realistic
 */
export function isRealisticCOP(cop: number | null | undefined): boolean {
  if (cop == null) return true; // null/undefined is acceptable (no data)
  return cop >= COP_THRESHOLDS.MIN_REALISTIC && cop <= COP_THRESHOLDS.MAX_REALISTIC;
}

interface MeasurementQualityData {
  month?: number | string | null;
  az?: number | null;
  az_heating?: number | null;
  electrical_energy_kwh?: number | null;
  thermal_energy_kwh?: number | null;
  electrical_energy_heating_kwh?: number | null;
  thermal_energy_heating_kwh?: number | null;
}

function energyRatio(thermal: number | null | undefined, electrical: number | null | undefined) {
  return thermal != null && electrical != null && electrical > 0 ? thermal / electrical : null;
}

/** Validate stored AZ, deriving missing monthly AZ from energy pairs. */
function validateData(data: MeasurementQualityData): DataQualityResult {
  const issues: DataQualityIssue[] = [];
  const isMonthly = data.month != null && Number(data.month) >= 1 && Number(data.month) <= 12;
  const totalCop =
    data.az ??
    (isMonthly ? energyRatio(data.thermal_energy_kwh, data.electrical_energy_kwh) : null);
  const heatingCop =
    data.az_heating ??
    (isMonthly
      ? energyRatio(data.thermal_energy_heating_kwh, data.electrical_energy_heating_kwh)
      : null);

  for (const [label, cop] of [
    ["COP", totalCop],
    ["COP Heating", heatingCop],
  ] as const) {
    if (cop == null) continue;
    // Heating-only COP can stay below 1 in summer due to standby consumption.
    // Apply the monthly lower bound only to positive total COP; zero heat is valid.
    // Short periods may legitimately have COP below 1 during defrosting.
    const minimum = isMonthly && label === "COP" && cop > 0 ? 1 : COP_THRESHOLDS.MIN_REALISTIC;
    if (Number.isNaN(cop)) {
      issues.push({
        type: "unrealistic_cop",
        message: `${label} is not a valid number (NaN)`,
        severity: "error",
      });
    } else if (cop > COP_THRESHOLDS.MAX_REALISTIC) {
      issues.push({
        type: "unrealistic_cop",
        message: `${label} ${cop.toFixed(1)} is unrealistically high (>${COP_THRESHOLDS.MAX_REALISTIC})`,
        severity: "error",
        translationKey: "dataQuality.unrealisticCopHigh",
        translationParams: { cop: cop.toFixed(1), max: COP_THRESHOLDS.MAX_REALISTIC },
      });
    } else if (cop < minimum) {
      issues.push({
        type: "unrealistic_cop",
        message: `${label} ${cop.toFixed(1)} is unrealistically low (<${minimum})`,
        severity: "error",
        translationKey: "dataQuality.unrealisticCopLow",
        translationParams: { cop: cop.toFixed(1), min: minimum },
      });
    }
  }

  // Check for negative values
  if (data.electrical_energy_kwh != null && data.electrical_energy_kwh < 0) {
    issues.push({
      type: "negative_value",
      message: "Electrical energy cannot be negative",
      severity: "error",
      translationKey: "dataQuality.negativeElectricalEnergy",
    });
  }

  if (data.thermal_energy_kwh != null && data.thermal_energy_kwh < 0) {
    issues.push({
      type: "negative_value",
      message:
        "Thermal energy can be negative during defrosting but we exclude it from the statistics",
      severity: "warning",
      translationKey: "dataQuality.negativeThermalEnergy",
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Validate measurement data quality
 * Monthly values additionally require positive total COP to be at least 1.
 */
export function validateMeasurementData(data: MeasurementQualityData): DataQualityResult {
  return validateData(data);
}

/**
 * Filter SystemAzData by realistic COP values calculated from energy totals
 * Used for histogram filtering after aggregating/calculating system totals
 *
 * @param systems - Array of system data to filter
 * @param checkAzFields - If true, also validate az/azHeating fields as COP values.
 *                        Set to false in energy mode where these fields contain energy values, not COP.
 */
export function filterSystemsByRealisticCOP<
  T extends {
    az?: number | null;
    azHeating?: number | null;
    thermalTotal?: number;
    electricalTotal?: number;
    thermalHeatingTotal?: number;
    electricalHeatingTotal?: number;
  },
>(systems: T[], checkAzFields = true): T[] {
  return systems.filter((system) => {
    // Check total COP calculated from energy totals
    if (
      system.thermalTotal != null &&
      system.electricalTotal != null &&
      system.electricalTotal > 0
    ) {
      const totalCop = system.thermalTotal / system.electricalTotal;
      if (!isRealisticCOP(totalCop)) {
        return false;
      }
    }

    // Check heating COP calculated from energy totals
    if (
      system.thermalHeatingTotal != null &&
      system.electricalHeatingTotal != null &&
      system.electricalHeatingTotal > 0
    ) {
      const heatingCop = system.thermalHeatingTotal / system.electricalHeatingTotal;
      if (!isRealisticCOP(heatingCop)) {
        return false;
      }
    }

    // Only check az/azHeating if they represent COP values (not in energy mode)
    if (checkAzFields) {
      if (system.az != null && !isRealisticCOP(system.az)) {
        return false;
      }

      if (system.azHeating != null && !isRealisticCOP(system.azHeating)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Filter out rows with unrealistic data for chart visualization
 * This excludes data that would skew charts and make them misleading
 *
 * @param data - Array of data rows to filter
 * @param _isHourly - Deprecated parameter, no longer used (kept for backward compatibility)
 */
export function filterRealisticDataForCharts<T extends MeasurementQualityData>(
  data: T[],
  _isHourly = false,
): T[] {
  return data.filter((row) => {
    const validation = validateData(row);
    // Preserve existing short-period handling of negative thermal energy.
    return !validation.issues.some((issue) => issue.severity === "error");
  });
}
