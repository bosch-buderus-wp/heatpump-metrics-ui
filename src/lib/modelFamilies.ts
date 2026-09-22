export const DEFAULT_MODEL_FAMILY = "cs5800_6800";
export const MODEL_FAMILY_IDS = [
  DEFAULT_MODEL_FAMILY,
  "cs3800",
  "cs8800",
  "cs7001",
  "cs7400",
] as const;
export function normalizeModelFamily(value: string | null): string {
  return MODEL_FAMILY_IDS.some((id) => id === value) ? (value as string) : DEFAULT_MODEL_FAMILY;
}
export function familyPath(path: string, family: string): string {
  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  params.set("family", family);
  return `${pathname}?${params}`;
}

// Evict public results after changing a system's family so cached rows cannot
// temporarily keep the system in its previous family's charts.
export const PUBLIC_FAMILY_QUERY_KEYS = new Set([
  "homeStats",
  "systems-with-location",
  "yearly",
  "daily",
  "measurement_deltas_view",
  "monthly_all_for_az_energy",
  "sample_daily_values_view_by_outdoor_temperature",
  "building-comparison",
  "building-comparison-heating-season",
  "insights-monthly",
]);
