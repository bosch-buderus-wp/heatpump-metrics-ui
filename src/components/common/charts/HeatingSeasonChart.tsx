import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { HeatingSeasonWeekDataRow } from "../../../lib/buildingEnergyComparison";

interface HeatingSeasonChartProps {
  data: HeatingSeasonWeekDataRow[];
}

function getMonthLabel(month: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2026, month - 1, 1));
}

export function HeatingSeasonChart({ data }: HeatingSeasonChartProps) {
  const { t, i18n } = useTranslation();

  if (data.length === 0) {
    return <div className="chart-no-data-card">{t("charts.noData")}</div>;
  }

  const weeks = data[0].weeks;
  const monthGroups = weeks.reduce<{ month: number; count: number }[]>((groups, week) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.month === week.month) {
      lastGroup.count += 1;
    } else {
      groups.push({ month: week.month, count: 1 });
    }
    return groups;
  }, []);

  return (
    <div
      className="heating-season-chart"
      role="img"
      aria-label={t("buildingComparison.heatingSeasonTitle")}
      style={{ "--heating-season-week-count": weeks.length } as React.CSSProperties}
    >
      <div className="heating-season-row heating-season-row--header" aria-hidden="true">
        <div />
        {monthGroups.map((group) => (
          <div key={group.month} style={{ gridColumn: `span ${group.count}` }}>
            {getMonthLabel(group.month, i18n.language)}
          </div>
        ))}
      </div>
      {data.map((row) => (
        <div className="heating-season-row" key={row.category}>
          <div className="heating-season-label">{row.category}</div>
          {row.weeks.map((week, index) => {
            const previousActive = row.weeks[index - 1]?.active ?? false;
            const nextActive = row.weeks[index + 1]?.active ?? false;
            const classes = [
              "heating-season-cell",
              week.active && "heating-season-cell--active",
              week.active && !previousActive && "heating-season-cell--start",
              week.active && !nextActive && "heating-season-cell--end",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <Tooltip
                key={week.startDate}
                slotProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "transparent",
                      color: "var(--text-primary)",
                      maxWidth: "none",
                      padding: 0,
                    },
                  },
                }}
                title={
                  <div className="chart-tooltip">
                    <div className="chart-tooltip-header">
                      {t("buildingComparison.heatingSeasonTooltipDate", {
                        start: week.startDate,
                        end: week.endDate,
                      })}
                    </div>
                    <div className="chart-tooltip-item">
                      <span className="chart-tooltip-text">
                        {t("buildingComparison.heatingSeasonTooltipDetails", {
                          share: Math.round(week.activeShare * 100),
                          count: week.sampleSize,
                        })}
                      </span>
                    </div>
                  </div>
                }
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
