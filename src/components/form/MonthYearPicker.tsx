import { useTranslation } from "react-i18next";

interface MonthYearPickerProps {
  month: number;
  year: number;
  onChange: (val: { month: number; year: number }) => void;
}

export function MonthYearPicker({ month, year, onChange }: MonthYearPickerProps) {
  const { t } = useTranslation();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed

  // Generate years from 2025 up to current year only
  const years: number[] = [];
  for (let yy = 2025; yy <= currentYear; yy++) {
    years.push(yy);
  }

  // If selected year is current year, only show months up to current month
  // Otherwise show all 12 months
  const maxMonth = year === currentYear ? currentMonth : 12;
  const availableMonths = Array.from({ length: maxMonth }, (_, i) => i + 1);

  // If current selection is a future month, adjust it to current month
  if (year === currentYear && month > currentMonth) {
    onChange({ month: currentMonth, year });
  }

  return (
    <div className="row picker">
      <label htmlFor="month-picker">{t("common.month")}</label>
      <select
        id="month-picker"
        value={month}
        onChange={(e) => onChange({ month: Number(e.target.value), year })}
      >
        {availableMonths.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <label htmlFor="year-picker">{t("common.year")}</label>
      <select
        id="year-picker"
        value={year}
        onChange={(e) => onChange({ month, year: Number(e.target.value) })}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
