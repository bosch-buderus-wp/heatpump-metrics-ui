const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

const formatters = new Map<string, Intl.DateTimeFormat>();

/** Format calendar dates in UTC and timestamps in the viewer's local time zone. */
export function formatDate(
  value: string | Date,
  locale: string,
  options: Intl.DateTimeFormatOptions = DATE_OPTIONS,
): string {
  const isCalendarDate = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : "";

  const formatOptions = isCalendarDate ? { ...options, timeZone: "UTC" } : options;
  const key = JSON.stringify([locale, formatOptions]);
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, formatOptions);
    formatters.set(key, formatter);
  }
  return formatter.format(date);
}
