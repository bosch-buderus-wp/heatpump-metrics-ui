/**
 * Data transformation utilities for preparing data for filtering and display.
 */

/**
 * Flattens nested heating_systems object to top-level fields.
 * This is needed for DataGrid filtering to work with nested Supabase data.
 *
 * Note: Excludes fields that exist in the parent row to avoid overwriting
 * important fields like created_at, user_id, etc.
 *
 * @example
 * const data = { id: 1, heating_systems: { model_odu: "7IR", heating_type: "Floor" } }
 * flattenHeatingSystemsFields(data)
 * // Returns: { id: 1, heating_systems: {...}, model_odu: "7IR", heating_type: "Floor" }
 */
export function flattenHeatingSystemsFields<T extends Record<string, unknown>>(
  row: T,
): T & Record<string, unknown> {
  const heatingSystem = row.heating_systems;

  if (!heatingSystem || typeof heatingSystem !== "object") {
    return row;
  }

  // Fields that should NOT be copied from heating_systems to avoid conflicts
  // These exist in both measurements and heating_systems tables
  const excludedFields = new Set(["created_at", "user_id", "heating_id"]);

  // Copy heating_systems fields, excluding conflicting ones
  const flattenedFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(heatingSystem)) {
    if (!excludedFields.has(key)) {
      flattenedFields[key] = value;
    }
  }

  return {
    ...row,
    ...flattenedFields,
  };
}

/**
 * Maps an array of rows and flattens heating_systems fields in each.
 */
export function flattenHeatingSystemsInArray<T extends Record<string, unknown>>(
  data: T[],
): Array<T & Record<string, unknown>> {
  return data.map(flattenHeatingSystemsFields);
}

/**
 * Applies thermometer offset correction to outdoor temperature measurements.
 *
 * Some heating systems have thermometers mounted in locations that cause systematic
 * measurement errors (e.g., mounted on a non-isolated wall of the heated building).
 * This function corrects these errors using a user-defined offset value.
 *
 * The offset represents how much HIGHER the thermometer reads compared to actual temperature.
 * For example:
 * - If thermometer reads 2°C higher than actual → offset = +2K
 * - Corrected temperature = measured temperature - offset
 *
 * @param outdoorTempC - The measured outdoor temperature in Celsius
 * @param offsetK - The thermometer offset in Kelvin (positive if thermometer reads too high)
 * @returns The corrected outdoor temperature, or null if input is null
 *
 * @example
 * applyThermometerOffset(5.0, 2.0)  // Returns 3.0 (thermometer reads 2K too high)
 * applyThermometerOffset(5.0, null) // Returns 5.0 (no correction needed)
 * applyThermometerOffset(null, 2.0) // Returns null (no measurement)
 */
export function applyThermometerOffset(
  outdoorTempC: number | null,
  offsetK: number | null | undefined,
): number | null {
  if (outdoorTempC === null) return null;
  if (offsetK === null || offsetK === undefined || offsetK === 0) return outdoorTempC;
  return outdoorTempC - offsetK;
}
