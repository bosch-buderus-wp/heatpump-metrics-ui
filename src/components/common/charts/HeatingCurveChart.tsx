import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { computeAzTemperatureRegression } from "../../../lib/chartDataProcessing";
import { CHART_COLORS } from "../../../lib/chartTheme";
import type { RegressionResult } from "../../../lib/regressionUtils";
import { generateCurvePoints } from "../../../lib/regressionUtils";

export interface HeatingCurveDataPoint {
  outdoor_temperature_c?: number | null;
  flow_temperature_c?: number | null;
  heating_id?: string | null;
  name?: string | null;
  date?: string | null;
  user_id?: string | null;
}

// Extended type for scatter plot points with custom data
interface ScatterPointData {
  x: number;
  y: number;
  heating_id?: string | null;
  name?: string | null;
  date?: string | null;
  user_id?: string | null;
}

interface HeatingCurveChartProps {
  data: HeatingCurveDataPoint[];
  currentUserId?: string | null;
}

export function HeatingCurveChart({ data, currentUserId }: HeatingCurveChartProps) {
  const { t } = useTranslation();
  const barColor = CHART_COLORS.primary;
  const userColor = CHART_COLORS.user;

  const heatingCurveKey = t("heatingCurve.chartLegend");

  // Stats box collapse state
  const [statsExpanded, setStatsExpanded] = useState(false);

  // Reference outdoor temperatures for predictions
  const referenceTemperatures = [-10, 0, 10];

  // Calculate predicted flow temp at given outdoor temperature
  const predictFlowTemp = (regression: RegressionResult, temperature: number): number => {
    return regression.slope * temperature + regression.intercept;
  };

  // Transform data for scatter plot
  const { scatterData, regression } = useMemo(() => {
    if (!data || data.length === 0)
      return { scatterData: [], regression: null, userRegression: null };

    // Filter and transform data points (filter for realistic temperature ranges)
    const points = data
      .map((row) => {
        const outdoor = row.outdoor_temperature_c;
        const flow = row.flow_temperature_c;

        // Only include points with valid and realistic temperature values
        // Filter: outdoor -30 to 40°C, flow 15 to 80°C (typical heating range)
        if (
          outdoor != null &&
          flow != null &&
          outdoor >= -30 &&
          outdoor <= 40 &&
          flow >= 15 &&
          flow <= 80
        ) {
          return {
            x: outdoor,
            y: flow,
            heating_id: row.heating_id,
            name: row.name,
            date: row.date,
            user_id: row.user_id,
          };
        }
        return null;
      })
      .filter((p) => p !== null);

    // Compute regression on all points (community average)
    const regressionResult = computeAzTemperatureRegression(points);

    // Separate user's data from other users' data
    const userPoints = currentUserId ? points.filter((p) => p.user_id === currentUserId) : [];
    const otherPoints = currentUserId ? points.filter((p) => p.user_id !== currentUserId) : points;

    // Compute regression on user's points only (if enough data)
    const userRegressionResult =
      userPoints.length >= 3 ? computeAzTemperatureRegression(userPoints) : null;

    // Get x-axis range from all points
    const xValues = points.map((p) => p.x);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);

    // Only show community regression when there's actual community data (other users)
    let curveData: ScatterPointData[] = [];
    if (regressionResult && otherPoints.length > 0) {
      const curvePoints = generateCurvePoints(regressionResult, xMin, xMax, 100);
      curveData = curvePoints.map((p) => ({ x: p.x, y: p.y }));
    }

    // Generate curve points for user's regression (show when user has enough data)
    let userCurveData: ScatterPointData[] = [];
    if (userRegressionResult && userPoints.length >= 3) {
      const userCurvePoints = generateCurvePoints(userRegressionResult, xMin, xMax, 100);
      userCurveData = userCurvePoints.map((p) => ({ x: p.x, y: p.y }));
    }

    // Return scatter series with curve overlay
    const scatterSeries = [
      {
        id: heatingCurveKey,
        data: otherPoints,
      },
    ];

    // Add user's data as separate series (if any)
    const myPrefix = t("charts.myPrefix");
    if (userPoints.length > 0) {
      scatterSeries.push({
        id: `${myPrefix}${heatingCurveKey}`,
        data: userPoints,
      });
    }

    // Add community regression curve if available
    if (curveData.length > 0) {
      scatterSeries.push({
        id: t("heatingCurve.regressionCurve"),
        data: curveData.map((p) => ({
          ...p,
          heating_id: undefined,
          name: undefined,
          date: undefined,
          user_id: undefined,
        })),
      });
    }

    // Add user's regression curve if available
    if (userCurveData.length > 0) {
      scatterSeries.push({
        id: t("heatingCurve.myRegressionCurve"),
        data: userCurveData.map((p) => ({
          ...p,
          heating_id: undefined,
          name: undefined,
          date: undefined,
          user_id: undefined,
        })),
      });
    }

    return {
      scatterData: scatterSeries,
      regression: regressionResult,
      userRegression: userRegressionResult,
    };
  }, [data, heatingCurveKey, t, currentUserId]);

  // Build legend items for this chart
  const heatingCurveLegendItems = useMemo(() => {
    const items: { id: string; label: string; color: string }[] = [
      {
        id: heatingCurveKey,
        label: heatingCurveKey,
        color: barColor,
      },
    ];

    // Add user series if present
    const myPrefix = t("charts.myPrefix");
    if (currentUserId && scatterData.some((s) => s.id === `${myPrefix}${heatingCurveKey}`)) {
      items.push({
        id: `${myPrefix}${heatingCurveKey}`,
        label: `${myPrefix}${heatingCurveKey}`,
        color: userColor,
      });
    }

    // Add regression curve if present
    if (scatterData.some((s) => s.id === t("heatingCurve.regressionCurve"))) {
      items.push({
        id: t("heatingCurve.regressionCurve"),
        label: t("heatingCurve.regressionCurve"),
        color: CHART_COLORS.regression,
      });
    }

    // Add user's regression curve if present
    if (scatterData.some((s) => s.id === t("heatingCurve.myRegressionCurve"))) {
      items.push({
        id: t("heatingCurve.myRegressionCurve"),
        label: t("heatingCurve.myRegressionCurve"),
        color: CHART_COLORS.userRegression,
      });
    }

    return items;
  }, [heatingCurveKey, currentUserId, scatterData, t]);

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
        colors={(node) => {
          // Color nodes based on which series they belong to
          if (node.serieId === t("heatingCurve.regressionCurve")) {
            return CHART_COLORS.regression;
          }
          // User's regression curve
          if (node.serieId === t("heatingCurve.myRegressionCurve")) {
            return CHART_COLORS.userRegression;
          }
          // Check if this is the user's series
          const myPrefix = t("charts.myPrefix");
          if (typeof node.serieId === "string" && node.serieId.startsWith(myPrefix)) {
            return userColor;
          }
          // Default color
          return barColor;
        }}
        nodeSize={(node) => {
          // Make regression curve points visible
          if (node.serieId === t("heatingCurve.regressionCurve")) {
            return 6;
          }
          return 8;
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: t("common.outdoorTemperature"),
          legendPosition: "middle",
          legendOffset: 32,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: t("common.flowTemperature"),
          legendPosition: "middle",
          legendOffset: -40,
        }}
        tooltip={({ node }) => {
          const pointData = node.data as ScatterPointData;
          const xValue = typeof pointData?.x === "number" ? pointData.x : 0;
          const yValue = typeof pointData?.y === "number" ? pointData.y : 0;
          const isCurrentUser = currentUserId && pointData && pointData.user_id === currentUserId;
          const dotColor = isCurrentUser ? userColor : barColor;

          return (
            <div className="chart-tooltip">
              <div className="chart-tooltip-header">{pointData.name || pointData.heating_id}</div>
              {pointData.date && (
                <div className="chart-tooltip-item">
                  <span className="chart-tooltip-text">{pointData.date}</span>
                </div>
              )}
              <div className="chart-tooltip-item">
                <span className="chart-tooltip-text">
                  {t("common.outdoorTemperature")}: <strong>{xValue.toFixed(1)}°C</strong>
                </span>
              </div>
              <div className="chart-tooltip-item">
                <div
                  className="chart-tooltip-indicator chart-tooltip-indicator-bar chart-tooltip-indicator-custom"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="chart-tooltip-text">
                  {t("common.flowTemperature")}: <strong>{yValue.toFixed(1)}°C</strong>
                </span>
              </div>
            </div>
          );
        }}
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
            data: heatingCurveLegendItems,
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
      {regression && (
        <div className="chart-stats chart-stats-absolute">
          <div className="chart-stats-header">
            <h3 className="chart-stats-title chart-stats-title-no-margin">
              {t("heatingCurve.statsTitle")}
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
              {/* Reference temperature predictions */}
              <div className="chart-stats-grid-3">
                {referenceTemperatures.map((temp) => {
                  const predictedFlow = predictFlowTemp(regression, temp);
                  return (
                    <Tooltip
                      key={temp}
                      title={t("heatingCurve.predictedFlowTooltip")}
                      placement="top"
                    >
                      <div className="chart-stat-item">
                        <span className="chart-stat-label">
                          {t("heatingCurve.flowAt")} {temp}°C
                        </span>
                        <span className="chart-stat-value">{predictedFlow.toFixed(1)}°C</span>
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
