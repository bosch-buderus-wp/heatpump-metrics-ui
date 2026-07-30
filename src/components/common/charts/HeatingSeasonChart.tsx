import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { HeatingSeasonDataRow } from "../../../lib/buildingEnergyComparison";

interface HeatingSeasonChartProps {
  data: HeatingSeasonDataRow[];
}

function getMonthLabel(month: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2026, month - 1, 1));
}

export function HeatingSeasonChart({ data }: HeatingSeasonChartProps) {
  const { t, i18n } = useTranslation();

  if (data.length === 0) {
    return <div className="chart-no-data-card">{t("charts.noData")}</div>;
  }

  return (
    <div
      className="heating-season-chart"
      role="img"
      aria-label={t("buildingComparison.heatingSeasonTitle")}
    >
      <div className="heating-season-row heating-season-row--header" aria-hidden="true">
        <div />
        {Array.from({ length: 12 }, (_, index) => (
          <div key={index + 1}>{getMonthLabel(index + 1, i18n.language)}</div>
        ))}
      </div>
      {data.map((row) => (
        <div className="heating-season-row" key={row.category}>
          <div className="heating-season-label">{row.category}</div>
          {row.months.map((month, index) => {
            const previousActive = row.months[index - 1]?.active ?? false;
            const nextActive = row.months[index + 1]?.active ?? false;
            const classes = [
              "heating-season-cell",
              month.active && "heating-season-cell--active",
              month.active && !previousActive && "heating-season-cell--start",
              month.active && !nextActive && "heating-season-cell--end",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <Tooltip
                key={month.month}
                title={t("buildingComparison.heatingSeasonTooltip", {
                  share: Math.round(month.activeShare * 100),
                  count: month.sampleSize,
                })}
              >
                <div className={classes} />
              </Tooltip>
            );
          })}
        </div>
      ))}
    </div>
  );
}
