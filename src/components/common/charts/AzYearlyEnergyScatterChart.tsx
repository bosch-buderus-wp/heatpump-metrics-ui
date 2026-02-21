import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CHART_COLORS } from "../../../lib/chartTheme";
import { loessSmoothWeighted } from "../../../lib/regressionUtils";

export interface YearlyEnergyScatterDataPoint {
  heating_id?: string | null;
  name?: string | null;
  user_id?: string | null;
  year?: number | null;
  month?: number | null;
  heated_area_m2?: number | null;
  thermal_energy_heating_kwh?: number | null;
  electrical_energy_heating_kwh?: number | null;
}

interface ScatterPointData {
  x: number;
  y: number;
  heating_id?: string | null;
  name?: string | null;
  user_id?: string | null;
  year?: number;
  coverage: number;
  extrapolated: boolean;
  monthCount: number;
}

interface AzYearlyEnergyScatterChartProps {
  data: YearlyEnergyScatterDataPoint[];
  currentUserId?: string | null;
}

const REFERENCE_ENERGY_VALUES = [30, 60, 90, 120] as const;
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function normalizeMonthProfile(profile: Record<number, number>): Record<number, number> {
  const total = MONTHS.reduce((sum, month) => sum + Math.max(0, profile[month] ?? 0), 0);
  if (total <= 0) {
    const uniform = 1 / 12;
    return MONTHS.reduce<Record<number, number>>((acc, month) => {
      acc[month] = uniform;
      return acc;
    }, {});
  }

  return MONTHS.reduce<Record<number, number>>((acc, month) => {
    acc[month] = Math.max(0, profile[month] ?? 0) / total;
    return acc;
  }, {});
}

export function AzYearlyEnergyScatterChart({
  data,
  currentUserId,
}: AzYearlyEnergyScatterChartProps) {
  const { t } = useTranslation();
  const [statsExpanded, setStatsExpanded] = useState(false);
  const azHeatingKey = t("common.azHeating");
  const mySeriesId = `${t("charts.myPrefix")}${azHeatingKey}`;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { scatterData, loessSmoother, curveData } = useMemo(() => {
    if (!data || data.length === 0) {
      return { scatterData: [], loessSmoother: null, curveData: [] as ScatterPointData[] };
    }

    const dataWithoutCurrentMonth = data.filter(
      (row) => !(row.year === currentYear && row.month === currentMonth),
    );

    if (dataWithoutCurrentMonth.length === 0) {
      return { scatterData: [], loessSmoother: null, curveData: [] as ScatterPointData[] };
    }

    type GroupAccumulator = {
      heating_id: string;
      name?: string | null;
      user_id?: string | null;
      year: number;
      months: Set<number>;
      heatedArea: number | null;
      thermalByMonth: Map<number, number>;
      electricalByMonth: Map<number, number>;
    };

    const groups = new Map<string, GroupAccumulator>();

    for (const row of dataWithoutCurrentMonth) {
      const heatingId = row.heating_id;
      const year = row.year;
      const month = row.month;

      if (!heatingId || year == null || month == null || month < 1 || month > 12) {
        continue;
      }

      const groupKey = `${heatingId}__${year}`;
      const existing = groups.get(groupKey);

      if (!existing) {
        const thermalByMonth = new Map<number, number>();
        const electricalByMonth = new Map<number, number>();
        thermalByMonth.set(month, row.thermal_energy_heating_kwh ?? 0);
        electricalByMonth.set(month, row.electrical_energy_heating_kwh ?? 0);

        groups.set(groupKey, {
          heating_id: heatingId,
          name: row.name,
          user_id: row.user_id,
          year,
          months: new Set([month]),
          heatedArea: row.heated_area_m2 ?? null,
          thermalByMonth,
          electricalByMonth,
        });
        continue;
      }

      existing.months.add(month);
      if (!existing.user_id && row.user_id) {
        existing.user_id = row.user_id;
      }
      if ((existing.heatedArea == null || existing.heatedArea <= 0) && row.heated_area_m2 != null) {
        existing.heatedArea = row.heated_area_m2;
      }
      existing.thermalByMonth.set(
        month,
        (existing.thermalByMonth.get(month) ?? 0) + (row.thermal_energy_heating_kwh ?? 0),
      );
      existing.electricalByMonth.set(
        month,
        (existing.electricalByMonth.get(month) ?? 0) + (row.electrical_energy_heating_kwh ?? 0),
      );
    }

    const completeGroups = Array.from(groups.values()).filter((group) => group.months.size === 12);

    const localSharesByMonth = new Map<number, number[]>();
    for (const month of MONTHS) {
      localSharesByMonth.set(month, []);
    }

    for (const group of completeGroups) {
      const annualThermal = MONTHS.reduce(
        (sum, month) => sum + (group.thermalByMonth.get(month) ?? 0),
        0,
      );
      if (annualThermal <= 0) {
        continue;
      }

      for (const month of MONTHS) {
        const monthThermal = group.thermalByMonth.get(month) ?? 0;
        localSharesByMonth.get(month)?.push(monthThermal / annualThermal);
      }
    }

    const localProfileRaw = MONTHS.reduce<Record<number, number>>((acc, month) => {
      acc[month] = median(localSharesByMonth.get(month) ?? []);
      return acc;
    }, {});
    const localProfile = normalizeMonthProfile(localProfileRaw);

    const defaultMonthTotals = MONTHS.reduce<Record<number, number>>((acc, month) => {
      acc[month] = 0;
      return acc;
    }, {});

    for (const row of dataWithoutCurrentMonth) {
      const month = row.month;
      if (month == null || month < 1 || month > 12) {
        continue;
      }
      defaultMonthTotals[month] += Math.max(0, row.thermal_energy_heating_kwh ?? 0);
    }
    const defaultProfile = normalizeMonthProfile(defaultMonthTotals);

    const localWeight = Math.min(1, completeGroups.length / 8);
    const finalProfile = normalizeMonthProfile(
      MONTHS.reduce<Record<number, number>>((acc, month) => {
        acc[month] = localWeight * localProfile[month] + (1 - localWeight) * defaultProfile[month];
        return acc;
      }, {}),
    );

    const points: ScatterPointData[] = [];

    for (const group of groups.values()) {
      const area = group.heatedArea;
      if (area == null || area <= 0) {
        continue;
      }

      const observedMonths = Array.from(group.months).filter((month) => month >= 1 && month <= 12);
      if (observedMonths.length === 0) {
        continue;
      }

      const thermalObserved = observedMonths.reduce(
        (sum, month) => sum + (group.thermalByMonth.get(month) ?? 0),
        0,
      );
      const electricalObserved = observedMonths.reduce(
        (sum, month) => sum + (group.electricalByMonth.get(month) ?? 0),
        0,
      );
      if (thermalObserved <= 0 || electricalObserved <= 0) {
        continue;
      }

      const coverage = observedMonths.reduce((sum, month) => sum + (finalProfile[month] ?? 0), 0);
      if (coverage <= 0) {
        continue;
      }

      const annualThermalEstimated = thermalObserved / coverage;
      points.push({
        x: annualThermalEstimated / area,
        y: thermalObserved / electricalObserved,
        heating_id: group.heating_id,
        name: group.name,
        user_id: group.user_id,
        year: group.year,
        coverage,
        extrapolated: coverage < 0.999,
        monthCount: observedMonths.length,
      });
    }

    const loessSource = points.filter((p) => p.coverage >= 0.4);
    const regressionPoints = loessSource.length >= 3 ? loessSource : points;

    const loessBandwidth = regressionPoints.length < 20 ? 1 : 0.8;
    const loessWeights = regressionPoints.map((point) => point.coverage ** 2);
    const smoother =
      regressionPoints.length >= 3
        ? loessSmoothWeighted(regressionPoints, loessWeights, loessBandwidth)
        : null;

    let loessCurveData: ScatterPointData[] = [];
    if (regressionPoints.length >= 3 && smoother) {
      const xValues = regressionPoints.map((p) => p.x);
      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      const numPoints = 120;
      const step = (xMax - xMin) / (numPoints - 1);
      const curvePoints = Array.from({ length: numPoints }, (_, index) => {
        const x = xMin + index * step;
        return { x, y: smoother(x) };
      });
      loessCurveData = curvePoints.map((p) => ({
        x: p.x,
        y: p.y,
        coverage: 1,
        extrapolated: false,
        monthCount: 12,
      }));
    }

    const userPoints = currentUserId
      ? points.filter((point) => point.user_id === currentUserId)
      : [];
    const otherPoints = currentUserId
      ? points.filter((point) => point.user_id !== currentUserId)
      : points;

    const series = [
      {
        id: azHeatingKey,
        data: otherPoints,
      },
    ];

    if (userPoints.length > 0) {
      series.push({
        id: mySeriesId,
        data: userPoints,
      });
    }

    if (loessCurveData.length > 0) {
      series.push({
        id: t("charts.regressionCurve"),
        data: loessCurveData,
      });
    }

    return {
      scatterData: series,
      loessSmoother: smoother,
      curveData: loessCurveData,
    };
  }, [data, azHeatingKey, t, currentYear, currentMonth, currentUserId, mySeriesId]);

  if (!data || data.length === 0) {
    return (
      <div className="chart-no-data-card card">
        <p className="muted">{t("charts.noData")}</p>
      </div>
    );
  }

  return (
    <div className="chart-container-relative card">
      <ResponsiveScatterPlot
        // biome-ignore lint/suspicious/noExplicitAny: Nivo's ScatterPlot type is complex
        data={scatterData as any}
        margin={{ top: 10, right: 60, bottom: 70, left: 50 }}
        xScale={{ type: "linear", min: "auto", max: "auto" }}
        yScale={{ type: "linear", min: "auto", max: "auto" }}
        blendMode="normal"
        // biome-ignore lint/suspicious/noExplicitAny: Nivo callback typing is too narrow here
        colors={(node: any) => {
          if (node.serieId === t("charts.regressionCurve")) {
            return CHART_COLORS.regression;
          }
          if (node.serieId === mySeriesId) {
            return CHART_COLORS.user;
          }

          const pointData = (node.data as unknown as Partial<ScatterPointData>) ?? {};
          if (pointData.extrapolated === true) {
            return CHART_COLORS.group2;
          }

          return CHART_COLORS.primary;
        }}
        // biome-ignore lint/suspicious/noExplicitAny: Nivo callback typing is too narrow here
        nodeSize={(node: any) => {
          if (node.serieId === t("charts.regressionCurve")) {
            return 6;
          }

          const pointData = (node.data as unknown as Partial<ScatterPointData>) ?? {};
          return Math.max(6, Math.min(10, 5 + (pointData.coverage ?? 1) * 5));
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: t("charts.yearlyHeatingEnergyPerArea"),
          legendPosition: "middle",
          legendOffset: 32,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: azHeatingKey,
          legendPosition: "middle",
          legendOffset: -40,
        }}
        tooltip={({ node }) => {
          const pointData = node.data as ScatterPointData;
          const xValue = typeof pointData?.x === "number" ? pointData.x : 0;
          const yValue = typeof pointData?.y === "number" ? pointData.y : 0;
          const dotColor =
            currentUserId && pointData.user_id === currentUserId
              ? CHART_COLORS.user
              : pointData.extrapolated
                ? CHART_COLORS.group2
                : CHART_COLORS.primary;

          return (
            <div className="chart-tooltip">
              <div className="chart-tooltip-header">{pointData.name || pointData.heating_id}</div>
              {pointData.year != null && (
                <div className="chart-tooltip-item">
                  <span className="chart-tooltip-text">{pointData.year}</span>
                </div>
              )}
              <div className="chart-tooltip-item">
                <span className="chart-tooltip-text">
                  {t("charts.yearlyHeatingEnergyPerArea")}:{" "}
                  <strong>{xValue.toFixed(1)} kWh/m²a</strong>
                </span>
              </div>
              <div className="chart-tooltip-item">
                <span className="chart-tooltip-text">
                  {t("charts.coverage")}: <strong>{(pointData.coverage * 100).toFixed(0)}%</strong>
                </span>
              </div>
              <div className="chart-tooltip-item">
                <span className="chart-tooltip-text">
                  {t("charts.observedMonths")}: <strong>{pointData.monthCount}</strong>
                </span>
              </div>
              {pointData.extrapolated && (
                <div className="chart-tooltip-item">
                  <span className="chart-tooltip-text">
                    {t("charts.extrapolatedFromPartialYear")}
                  </span>
                </div>
              )}
              <div className="chart-tooltip-item">
                <div
                  className="chart-tooltip-indicator chart-tooltip-indicator-bar chart-tooltip-indicator-custom"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="chart-tooltip-text">
                  {azHeatingKey}: <strong>{yValue.toFixed(2)}</strong>
                </span>
              </div>
            </div>
          );
        }}
        layers={[
          "grid",
          "axes",
          // Draw LOESS as a connected path, then keep nodes on top for readability.
          // biome-ignore lint/suspicious/noExplicitAny: Nivo layer typing is complex
          ({ xScale, yScale }: any) => {
            if (!curveData || curveData.length < 2) {
              return null;
            }
            const sorted = [...curveData].sort((a, b) => a.x - b.x);
            const pathData = sorted
              .map((point, index) => {
                const cmd = index === 0 ? "M" : "L";
                return `${cmd}${xScale(point.x)},${yScale(point.y)}`;
              })
              .join(" ");
            return (
              <path
                d={pathData}
                fill="none"
                stroke={CHART_COLORS.regression}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          },
          "nodes",
          "mesh",
          "legends",
        ]}
        legends={[
          {
            anchor: "bottom",
            direction: "row",
            justify: false,
            translateX: 0,
            translateY: 70,
            itemsSpacing: 2,
            itemWidth: 180,
            itemHeight: 20,
            itemDirection: "left-to-right",
            itemOpacity: 0.85,
            symbolSize: 20,
            symbolShape: "circle",
            data: [
              {
                id: azHeatingKey,
                label: azHeatingKey,
                color: CHART_COLORS.primary,
              },
              ...(currentUserId
                ? [
                    {
                      id: mySeriesId,
                      label: mySeriesId,
                      color: CHART_COLORS.user,
                    },
                  ]
                : []),
              {
                id: t("charts.extrapolatedFromPartialYear"),
                label: t("charts.extrapolatedFromPartialYear"),
                color: CHART_COLORS.group2,
              },
              {
                id: t("charts.regressionCurve"),
                label: t("charts.regressionCurve"),
                color: CHART_COLORS.regression,
              },
            ],
            toggleSerie: false,
            effects: [
              {
                on: "hover",
                style: {
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
      />
      {loessSmoother && (
        <div className="chart-stats chart-stats-absolute">
          <div className="chart-stats-header">
            <h3 className="chart-stats-title chart-stats-title-no-margin">
              {t("charts.azYearlyEnergyStats")}
            </h3>
            <Tooltip title={statsExpanded ? t("charts.hideStats") : t("charts.showStats")}>
              <IconButton
                size="small"
                onClick={() => setStatsExpanded(!statsExpanded)}
                sx={{ ml: 1, p: 0.5 }}
              >
                {statsExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            </Tooltip>
          </div>
          {statsExpanded && (
            <div className="chart-stats-expanded">
              <div className="chart-stats-grid-4">
                {REFERENCE_ENERGY_VALUES.map((value) => {
                  const predictedCop = loessSmoother(value);
                  return (
                    <Tooltip
                      key={value}
                      title={t("charts.predictedCopTooltipEnergy")}
                      placement="top"
                    >
                      <div className="chart-stat-item">
                        <span className="chart-stat-label chart-stat-label-mixedcase">
                          {t("common.az_short")} {value} kWh/m²a
                        </span>
                        <span className="chart-stat-value">{predictedCop.toFixed(2)}</span>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
