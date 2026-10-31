import { robustLinearRegression } from "./regressionUtils";

export interface HeatingLoadDailyValue {
  date: string | null;
  outdoor_temperature_c: number | null;
  thermal_energy_heating_kwh: number | null;
}

export interface HeatingLoadPoint {
  x: number;
  y: number;
  date: string;
}

// Conservative starting criteria, not a standardised heating-load calculation.
export const MIN_HEATING_DAYS = 10;
export const MIN_TEMPERATURE_SPAN = 5;
export const MAX_FIT_TEMPERATURE = 15;
export const MAX_COLDEST_TEMPERATURE = 5;

export function analyzeHeatingLoad(
  values: HeatingLoadDailyValue[],
  designTemperature: number | null,
) {
  const points: HeatingLoadPoint[] = values.flatMap((row) => {
    const temperature = row.outdoor_temperature_c;
    const energy = row.thermal_energy_heating_kwh;
    if (
      !row.date ||
      temperature == null ||
      !Number.isFinite(temperature) ||
      temperature < -30 ||
      temperature > MAX_FIT_TEMPERATURE ||
      energy == null ||
      !Number.isFinite(energy) ||
      energy <= 0
    )
      return [];
    return [{ x: temperature, y: energy / 24, date: row.date }];
  });

  if (points.length === 0) {
    return {
      points,
      regression: null,
      estimate: null,
      minTemperature: null,
      maxTemperature: null,
      startDate: null,
      endDate: null,
      extrapolation: null,
    };
  }

  const minTemperature = Math.min(...points.map((point) => point.x));
  const maxTemperature = Math.max(...points.map((point) => point.x));
  const dates = points.map((point) => point.date).sort();
  const enoughData =
    points.length >= MIN_HEATING_DAYS &&
    maxTemperature - minTemperature >= MIN_TEMPERATURE_SPAN &&
    minTemperature <= MAX_COLDEST_TEMPERATURE;
  const fit = enoughData ? robustLinearRegression(points) : null;
  const regression =
    fit && Number.isFinite(fit.slope) && Number.isFinite(fit.intercept) && fit.slope < 0
      ? fit
      : null;
  const predicted =
    regression && designTemperature != null && Number.isFinite(designTemperature)
      ? regression.slope * designTemperature + regression.intercept
      : null;
  const estimate =
    predicted != null && Number.isFinite(predicted) && predicted > 0 ? predicted : null;
  const extrapolation =
    estimate != null && designTemperature != null
      ? Math.max(minTemperature - designTemperature, designTemperature - maxTemperature, 0)
      : null;

  return {
    points,
    regression,
    estimate,
    minTemperature,
    maxTemperature,
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    extrapolation,
  };
}
