import type { TFunction } from "i18next";

// Central enum label helpers that use i18n for translations.
// These functions provide translated labels for Supabase enum-like codes.
// Unknown codes will fall back to the raw code.

/**
 * Get a translated label from i18n or fall back to raw code
 * @param t - i18next translation function
 * @param namespace - The i18n namespace path (e.g., "models.heating_type")
 * @param code - The enum code to translate
 * @returns Translated label or the raw code if translation is missing
 */
export function getLabel(
  t: TFunction,
  namespace: string,
  code: string | number | null | undefined,
): string {
  if (code == null || code === "") return "";
  const key = `${namespace}.${String(code)}`;
  const translation = t(key);
  // If translation key is returned as-is, fall back to the raw code
  return translation !== key ? translation : String(code);
}

/**
 * Generate options array for a select dropdown from enum values
 * @param t - i18next translation function
 * @param namespace - The i18n namespace path (e.g., "models.heating_type")
 * @param values - Array of enum values
 * @returns Array of {value, label} objects for select options
 */
export function getEnumOptions(
  t: TFunction,
  namespace: string,
  values: string[],
): Array<{ value: string; label: string }> {
  return values.map((value) => ({
    value,
    label: getLabel(t, namespace, value),
  }));
}

// Helper functions for each enum type
export function getHeatingTypeLabel(
  t: TFunction,
  code: string | number | null | undefined,
): string {
  return getLabel(t, "models.heating_type", code);
}

export function getModelIduLabel(t: TFunction, code: string | number | null | undefined): string {
  return getLabel(t, "models.model_idu", code);
}

export function getModelOduLabel(t: TFunction, code: string | number | null | undefined): string {
  return getLabel(t, "models.model_odu", code);
}

export function getSwIduLabel(t: TFunction, code: string | number | null | undefined): string {
  return getLabel(t, "models.sw_idu", code);
}

export function getSwOduLabel(t: TFunction, code: string | number | null | undefined): string {
  return getLabel(t, "models.sw_odu", code);
}

export function getBuildingTypeLabel(
  t: TFunction,
  code: string | number | null | undefined,
): string {
  return getLabel(t, "models.building_type", code);
}

export function getBuildingEnergyStandardLabel(
  t: TFunction,
  code: string | number | null | undefined,
): string {
  return getLabel(t, "models.building_energy_standard", code);
}

// Enum value arrays (keys only, labels come from i18n)
export const HEATING_TYPE_VALUES = ["underfloorheating", "radiators", "mixed"];

export const MODEL_IDU_VALUES = [
  "CS5800i_E",
  "CS5800i_MB",
  "CS5800i_M",
  "CS6800i_E",
  "CS6800i_MB",
  "CS6800i_M",
  "WLW176i_E",
  "WLW176i_TP70",
  "WLW176i_TP180",
  "WLW186i_E",
  "WLW186i_TP70",
  "WLW186i_TP180",
];

export const MODEL_ODU_VALUES = ["4", "5", "7", "10", "12"];

export const SW_IDU_VALUES = ["5.27", "5.35", "7.10.0", "9.6.1", "9.7.0", "12.11.1"];

export const SW_ODU_VALUES = ["5.27", "5.35", "7.10.0", "9.6.0", "9.10.0", "9.12.0", "9.15.0"];

export const BUILDING_TYPE_VALUES = [
  "single_family_detached",
  "semi_detached",
  "terraced_mid",
  "terraced_end",
  "multi_family_small",
  "multi_family_large",
  "apartment",
  "commercial",
  "other",
];

export const BUILDING_ENERGY_STANDARD_VALUES = [
  "unknown",
  "passive_house",
  "kfw_40_plus",
  "kfw_40",
  "kfw_55",
  "kfw_70",
  "kfw_85",
  "kfw_100",
  "kfw_115",
  "kfw_denkmalschutz",
  "old_building_unrenovated",
  "old_building_partially_renovated",
  "energetically_renovated",
  "nearly_zero_energy_building",
  "minergie",
];
