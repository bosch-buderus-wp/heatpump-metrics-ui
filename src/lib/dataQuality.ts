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
  MAX_REALISTIC: 8.0,
  MIN_REALISTIC: 0.0,
};

/**
 * Check if a COP value is realistic
 */
export function isRealisticCOP(cop: number | null | undefined): boolean {
  if (cop == null) return true; // null/undefined is acceptable (no data)
  return cop >= COP_THRESHOLDS.MIN_REALISTIC && cop <= COP_THRESHOLDS.MAX_REALISTIC;
}

/**
 * Validate measurement data quality
 * Works for hourly, daily, and monthly data
 */
function validateData(data: {
  az?: number | null;
  az_heating?: number | null;
  electrical_energy_kwh?: number | null;
  thermal_energy_kwh?: number | null;
}): DataQualityResult {
  const issues: DataQualityIssue[] = [];

  // Check total COP
  if (data.az != null && !isRealisticCOP(data.az)) {
    if (data.az > COP_THRESHOLDS.MAX_REALISTIC) {
      issues.push({
        type: "unrealistic_cop",
        message: `COP ${data.az.toFixed(1)} is unrealistically high (>${COP_THRESHOLDS.MAX_REALISTIC})`,
        severity: "error",
        translationKey: "dataQuality.unrealisticCopHigh",
        translationParams: { cop: data.az.toFixed(1), max: COP_THRESHOLDS.MAX_REALISTIC },
      });
    } else if (data.az < COP_THRESHOLDS.MIN_REALISTIC) {
      issues.push({
        type: "unrealistic_cop",
        message: `COP ${data.az.toFixed(1)} is unrealistically low (<${COP_THRESHOLDS.MIN_REALISTIC})`,
        severity: "error",
        translationKey: "dataQuality.unrealisticCopLow",
        translationParams: { cop: data.az.toFixed(1), min: COP_THRESHOLDS.MIN_REALISTIC },
      });
    }
  }

  // Check heating COP
  if (data.az_heating != null && !isRealisticCOP(data.az_heating)) {
    if (data.az_heating > COP_THRESHOLDS.MAX_REALISTIC) {
      issues.push({
        type: "unrealistic_cop",
        message: `COP Heating ${data.az_heating.toFixed(1)} is unrealistically high (>${COP_THRESHOLDS.MAX_REALISTIC})`,
        severity: "error",
        translationKey: "dataQuality.unrealisticCopHigh",
        translationParams: { cop: data.az_heating.toFixed(1), max: COP_THRESHOLDS.MAX_REALISTIC },
      });
    } else if (data.az_heating < COP_THRESHOLDS.MIN_REALISTIC) {
      issues.push({
        type: "unrealistic_cop",
        message: `COP Heating ${data.az_heating.toFixed(1)} is unrealistically low (<${COP_THRESHOLDS.MIN_REALISTIC})`,
        severity: "error",
        translationKey: "dataQuality.unrealisticCopLow",
        translationParams: { cop: data.az_heating.toFixed(1), min: COP_THRESHOLDS.MIN_REALISTIC },
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
 * Works for hourly, daily, and monthly data (same validation rules for all)
 */
export function validateMeasurementData(data: {
  az?: number | null;
  az_heating?: number | null;
  electrical_energy_kwh?: number | null;
  thermal_energy_kwh?: number | null;
}): DataQualityResult {
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
export function filterRealisticDataForCharts<
  T extends {
    az?: number | null;
    az_heating?: number | null;
    electrical_energy_kwh?: number | null;
  },
>(data: T[], _isHourly = false): T[] {
  return data.filter((row) => {
    // Exclude if total COP is unrealistic
    if (row.az != null && !isRealisticCOP(row.az)) {
      return false;
    }

    // Exclude if heating COP is unrealistic
    if (row.az_heating != null && !isRealisticCOP(row.az_heating)) {
      return false;
    }

    // Exclude if energy values are negative
    if (row.electrical_energy_kwh != null && row.electrical_energy_kwh < 0) {
      return false;
    }

    return true;
  });
}
