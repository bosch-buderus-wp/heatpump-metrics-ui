import { Alert } from "@mui/material";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CHART_COLORS } from "../../../lib/chartTheme";
import { formatDate } from "../../../lib/dateFormatting";
import { analyzeHeatingLoad, type HeatingLoadDailyValue } from "../../../lib/heatingLoad";
import { generateCurvePoints } from "../../../lib/regressionUtils";
import { ChartUtilityFrame } from "../layout/ChartUtilityFrame";

interface HeatingLoadChartProps {
  values: HeatingLoadDailyValue[];
  systemName: string;
  designTemperature: number | null;
  declaredLoad: number | null;
  isLoading: boolean;
}

export function HeatingLoadChart({
  values,
  systemName,
  designTemperature,
  declaredLoad,
  isLoading,
}: HeatingLoadChartProps) {
  const { t, i18n } = useTranslation();
  const chartRef = useRef<HTMLDivElement>(null);
  const locale = i18n.resolvedLanguage || i18n.language;
  const analysis = useMemo(
    () => analyzeHeatingLoad(values, designTemperature),
    [values, designTemperature],
  );
  const { points, regression, estimate, minTemperature, maxTemperature, extrapolation } = analysis;
  const hasDeclaredLoad = declaredLoad != null && Number.isFinite(declaredLoad) && declaredLoad > 0;
  const showDeclared =
    hasDeclaredLoad && designTemperature != null && Number.isFinite(designTemperature);

  const series = useMemo(() => {
    const result: Array<{ id: string; data: Array<{ x: number; y: number; date?: string }> }> = [
      { id: t("heatingLoad.measurements"), data: points },
    ];
    if (regression && minTemperature != null && maxTemperature != null) {
      result.push({
        id: t("heatingLoad.regression"),
        data: generateCurvePoints(regression, minTemperature, maxTemperature, 80),
      });
      if (
        estimate != null &&
        designTemperature != null &&
        extrapolation != null &&
        extrapolation > 0
      ) {
        const edge = designTemperature < minTemperature ? minTemperature : maxTemperature;
        result.push({
          id: t("heatingLoad.extrapolation"),
          data: generateCurvePoints(
            regression,
            Math.min(edge, designTemperature),
            Math.max(edge, designTemperature),
            12,
          ),
        });
      }
    }
    if (estimate != null && designTemperature != null)
      result.push({
        id: t("heatingLoad.estimated"),
        data: [{ x: designTemperature, y: estimate }],
      });
    if (showDeclared && designTemperature != null && declaredLoad != null)
      result.push({
        id: t("heatingLoad.declared"),
        data: [{ x: designTemperature, y: declaredLoad }],
      });
    return result;
  }, [
    points,
    regression,
    minTemperature,
    maxTemperature,
    extrapolation,
    estimate,
    designTemperature,
    showDeclared,
    declaredLoad,
    t,
  ]);

  if (isLoading)
    return (
      <ChartUtilityFrame isLoading>
        <div />
      </ChartUtilityFrame>
    );
  if (!points.length)
    return (
      <div className="chart-no-data-card card">
        <p className="muted">{t("heatingLoad.noData")}</p>
      </div>
    );

  return (
    <>
      <p className="muted">
        {t("heatingLoad.dataSummary", {
          name: systemName,
          count: points.length,
          start: analysis.startDate ? formatDate(analysis.startDate, locale) : "",
          end: analysis.endDate ? formatDate(analysis.endDate, locale) : "",
          min: minTemperature?.toFixed(1),
          max: maxTemperature?.toFixed(1),
        })}
      </p>
      {!regression && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("heatingLoad.insufficient")}
        </Alert>
      )}
      {regression && designTemperature == null && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("heatingLoad.noDesignTemperature")}
        </Alert>
      )}
      {estimate != null && (
        <p>
          <strong>
            {t("heatingLoad.estimated")}: {estimate.toFixed(1)} kW
          </strong>
          {designTemperature != null && ` (${designTemperature.toFixed(1)} °C)`}
          {hasDeclaredLoad &&
            declaredLoad != null &&
            ` · ${t("heatingLoad.declared")}: ${declaredLoad.toFixed(1)} kW · ${t("heatingLoad.difference")}: ${estimate - declaredLoad >= 0 ? "+" : ""}${(estimate - declaredLoad).toFixed(1)} kW`}
        </p>
      )}
      <div ref={chartRef} className="heating-load-chart">
        <ChartUtilityFrame utility={<strong>{systemName}</strong>}>
          <ResponsiveScatterPlot
            data={series}
            margin={{ top: 15, right: 25, bottom: 55, left: 65 }}
            xScale={{ type: "linear", min: "auto", max: "auto" }}
            yScale={{ type: "linear", min: 0, max: "auto" }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickValues: 6,
              tickSize: 5,
              tickPadding: 5,
              legend: `${t("common.outdoorTemperature")} (°C)`,
              legendPosition: "middle",
              legendOffset: 35,
            }}
            axisLeft={{
              tickValues: 6,
              tickSize: 5,
              tickPadding: 5,
              legend: t("heatingLoad.powerAxis"),
              legendPosition: "middle",
              legendOffset: -52,
            }}
            colors={(node) =>
              node.serieId === t("heatingLoad.measurements")
                ? CHART_COLORS.primary
                : node.serieId === t("heatingLoad.declared")
                  ? CHART_COLORS.flowTemp
                  : node.serieId === t("heatingLoad.estimated")
                    ? CHART_COLORS.user
                    : CHART_COLORS.regression
            }
            nodeSize={(node) =>
              node.serieId === t("heatingLoad.estimated") ||
              node.serieId === t("heatingLoad.declared")
                ? 14
                : node.serieId === t("heatingLoad.regression")
                  ? 4
                  : node.serieId === t("heatingLoad.extrapolation")
                    ? 3
                    : 8
            }
            tooltip={({ node }) => {
              const point = node.data as { x: number; y: number; date?: string };
              const chartWidth = chartRef.current?.clientWidth ?? 0;
              const pointX = node.x + 65; // Include the chart's left margin.
              const tooltipHalfWidth = 150;
              const shiftX = chartWidth
                ? Math.max(0, tooltipHalfWidth - pointX) -
                  Math.max(0, pointX - (chartWidth - tooltipHalfWidth))
                : 0;
              return (
                <div
                  className="chart-tooltip heating-load-tooltip"
                  style={{ transform: `translateX(${shiftX}px)` }}
                >
                  <div className="chart-tooltip-header">{String(node.serieId)}</div>
                  {point.date && <div>{formatDate(point.date, locale)}</div>}
                  <div className="chart-tooltip-item">
                    {t("common.outdoorTemperature")}: {point.x.toFixed(1)} °C
                  </div>
                  <div className="chart-tooltip-item">
                    {t("heatingLoad.powerAxis")}: {point.y.toFixed(2)} kW
                  </div>
                </div>
              );
            }}
          />
        </ChartUtilityFrame>
      </div>
      <div className="heating-load-legend">
        {series.map((item) => (
          <span key={item.id}>
            <span
              className="heating-load-legend-dot"
              style={{
                backgroundColor:
                  item.id === t("heatingLoad.measurements")
                    ? CHART_COLORS.primary
                    : item.id === t("heatingLoad.declared")
                      ? CHART_COLORS.flowTemp
                      : item.id === t("heatingLoad.estimated")
                        ? CHART_COLORS.user
                        : CHART_COLORS.regression,
              }}
            />
            {item.id}
          </span>
        ))}
      </div>
    </>
  );
}
