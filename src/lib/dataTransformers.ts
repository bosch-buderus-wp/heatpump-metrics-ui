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
