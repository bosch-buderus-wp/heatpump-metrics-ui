/**
 * Centralized color constants for all chart components and UI elements
 * Ensures consistent theming across the application
 */

export const CHART_COLORS = {
  // Primary data colors
  primary: "#23a477ff", // Green for primary data (AZ bars, active series)
  user: "#ff9800", // Orange for current user's data points
  inactive: "#cccccc", // Gray for inactive/disabled items

  // Temperature line colors
  outdoorTemp: "#3b82f6", // Blue for outdoor temperature
  flowTemp: "#ef4444", // Red for flow temperature

  // Statistical/analysis colors
  regression: "#176f50ff", // Red for regression curves (community average)
  userRegression: "#ff99009f", // Dark orange for user's regression curve

  // Comparison mode colors (used for both chart bars and filter UI)
  group1: "#23a477ff", // Green for group 1 (charts and filters)
  group2: "#86efac", // Light green for group 2 (charts and filters)
} as const;

// Type for accessing color values with autocomplete
export type ChartColorKey = keyof typeof CHART_COLORS;
