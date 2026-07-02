export const SYSTEM_CONSUMPTION_KW = 0.025;

export type EnergyPeriod = "hour" | "day" | "month";

export interface EnergyDataRow {
  created_at?: string | null;
  date?: string | null;
  year?: number | null;
  month?: number | null;
  thermal_energy_kwh?: number | null;
  electrical_energy_kwh?: number | null;
  thermal_energy_heating_kwh?: number | null;
  electrical_energy_heating_kwh?: number | null;
  az?: number | null;
  az_heating?: number | null;
}

function elapsedHours(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
}

export function getPeriodHours(row: EnergyDataRow, period: EnergyPeriod, now = new Date()): number {
  if (period === "hour") return 1;

  if (period === "day" && row.date) {
    const start = new Date(`${row.date}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return now > start && now < end ? elapsedHours(start, now) : now >= end ? 24 : 0;
  }

  if (period === "month" && row.year && row.month) {
    const start = new Date(row.year, row.month - 1, 1);
    const end = new Date(row.year, row.month, 1);
    return now > start && now < end
      ? elapsedHours(start, now)
      : now >= end
        ? elapsedHours(start, end)
        : 0;
  }

  return 0;
}

function subtractSystemConsumption(value: number | null | undefined, hours: number) {
  if (value == null) return value;
  return Math.max(0, value - SYSTEM_CONSUMPTION_KW * hours);
}

function calculateAz(thermal: number | null | undefined, electrical: number | null | undefined) {
  return electrical != null && electrical > 0 && thermal != null ? thermal / electrical : null;
}

export function removeSystemConsumption<T extends EnergyDataRow>(
  row: T,
  period: EnergyPeriod,
  now = new Date(),
): T & {
  electrical_energy_kwh: number | null | undefined;
  electrical_energy_heating_kwh: number | null | undefined;
  az: number | null;
  az_heating: number | null;
} {
  const hours = getPeriodHours(row, period, now);
  const electrical = subtractSystemConsumption(row.electrical_energy_kwh, hours);
  const electricalHeating = subtractSystemConsumption(row.electrical_energy_heating_kwh, hours);

  return {
    ...row,
    electrical_energy_kwh: electrical,
    electrical_energy_heating_kwh: electricalHeating,
    az: calculateAz(row.thermal_energy_kwh, electrical),
    az_heating: calculateAz(row.thermal_energy_heating_kwh, electricalHeating),
  };
}

export function removeSystemConsumptionFromRows<T extends EnergyDataRow>(
  rows: T[] | undefined,
  period: EnergyPeriod,
): T[] | undefined {
  return rows?.map((row) => removeSystemConsumption(row, period));
}
