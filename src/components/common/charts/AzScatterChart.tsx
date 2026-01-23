import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Button, ButtonGroup, IconButton, Tooltip } from "@mui/material";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useChartLegend } from "../../../hooks/useChartLegend";
import { CHART_COLORS } from "../../../lib/chartTheme";
import { filterRealisticDataForCharts } from "../../../lib/dataQuality";
import { generateLoessCurvePoints, loessSmooth } from "../../../lib/regressionUtils";

export interface ScatterDataPoint {
  az?: number | null;
  az_heating?: number | null;
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

type TemperatureMode = "outdoor" | "flow" | "delta";

interface AzScatterChartProps {
  data: ScatterDataPoint[];
  currentUserId?: string | null;
}

export function AzScatterChart({ data, currentUserId }: AzScatterChartProps) {
  const { t } = useTranslation();
  const barColor = CHART_COLORS.primary;
  const userColor = CHART_COLORS.user;

  const azTotalKey = t("common.azTotal");
  const azHeatingKey = t("common.azHeating");

  // Track which temperature mode is active
  const [temperatureMode, setTemperatureMode] = useState<TemperatureMode>("outdoor");

  // Stats box collapse state
  const [statsExpanded, setStatsExpanded] = useState(false);

  // Get reference temperatures based on temperature mode
  const getReferenceTemperatures = (mode: TemperatureMode) => {
    switch (mode) {
      case "outdoor":
        return [-10, -7, 2, 7]; // Common outdoor temps in heat pump specs
      case "flow":
        return [30, 35, 40, 45]; // Typical flow temperatures
      case "delta":
        return [25, 30, 35, 40]; // Typical temperature deltas
      default:
        return [-10, -7, 2, 7];
    }
  };

  // Use the chart legend hook - restrict clicks to only AZ toggles
  // (regression curve and user data series should not be clickable)
  const { activeKey, legendItems, handleLegendClick } = useChartLegend({
    azTotalKey,
    azHeatingKey,
    barColor,
    outdoorTempLabel: t("common.outdoorTemperature"),
    flowTempLabel: t("common.flowTemperature"),
    clickableIds: [azTotalKey, azHeatingKey],
  });

  // Transform data for scatter plot - create both series but only populate the active one
  const { scatterData, loessSmoother } = useMemo(() => {
    if (!data || data.length === 0)
      return { scatterData: [], activePoints: [], loessSmoother: null };

    // Filter out unrealistic data before processing
    const realisticData = filterRealisticDataForCharts(data);

    // Determine which AZ values to use based on active key
    const useAzHeating = activeKey === azHeatingKey;

    // Filter and transform data points
    const points = realisticData
      .map((row) => {
        const azValue = useAzHeating ? row.az_heating : row.az;
        const outdoor = row.outdoor_temperature_c;
        const flow = row.flow_temperature_c;

        // Calculate x value based on temperature mode
        let xValue: number | null = null;
        if (temperatureMode === "outdoor") {
          xValue = outdoor ?? null;
        } else if (temperatureMode === "flow") {
          xValue = flow ?? null;
        } else if (temperatureMode === "delta") {
          if (flow != null && outdoor != null) {
            xValue = flow - outdoor;
          }
        }

        // Only include points with valid az and temperature values
        if (azValue != null && azValue > 0 && xValue != null) {
          return {
            x: xValue,
            y: azValue,
            heating_id: row.heating_id,
            name: row.name,
            date: row.date,
            user_id: row.user_id,
          };
        }
        return null;
      })
      .filter((p) => p !== null);

    // Create LOESS smoother for both curve and stats predictions
    const smoother = points.length >= 3 ? loessSmooth(points, 0.25) : null;

    // Generate LOESS curve points for smoother, non-linear fit
    let curveData: ScatterPointData[] = [];
    if (points.length >= 3) {
      const xValues = points.map((p) => p.x);
      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      const curvePoints = generateLoessCurvePoints(points, xMin, xMax, 100, 0.25);
      curveData = curvePoints.map((p) => ({ x: p.x, y: p.y }));
    }

    // Separate user's data from other users' data for the active series
    const userPoints = currentUserId ? points.filter((p) => p.user_id === currentUserId) : [];
    const otherPoints = currentUserId ? points.filter((p) => p.user_id !== currentUserId) : points;

    // Return scatter series with curve overlay
    // Always include both azTotalKey and azHeatingKey series (empty if not active)
    const scatterSeries = [
      {
        id: azTotalKey,
        data: activeKey === azTotalKey ? otherPoints : [],
      },
      {
        id: azHeatingKey,
        data: activeKey === azHeatingKey ? otherPoints : [],
      },
    ];

    // Add user's data as separate series (if any)
    const myPrefix = t("charts.myPrefix");
    if (activeKey === azTotalKey && userPoints.length > 0) {
      scatterSeries.push({
        id: `${myPrefix}${azTotalKey}`,
        data: userPoints,
      });
    } else if (activeKey === azHeatingKey && userPoints.length > 0) {
      scatterSeries.push({
        id: `${myPrefix}${azHeatingKey}`,
        data: userPoints,
      });
    }

    // Add curve as a separate series if available (use translation key)
    if (curveData.length > 0) {
      scatterSeries.push({
        id: t("charts.regressionCurve"),
        data: curveData.map((p) => ({
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
      activePoints: points as ScatterPointData[],
      loessSmoother: smoother,
    };
  }, [data, activeKey, azHeatingKey, azTotalKey, temperatureMode, t, currentUserId]);

  // Get x-axis label based on temperature mode
  const getXAxisLabel = () => {
    if (temperatureMode === "outdoor") {
      return t("common.outdoorTemperature");
    }
    if (temperatureMode === "flow") {
      return t("common.flowTemperature");
    }
    return t("charts.temperatureDelta");
  };

  if (!data || data.length === 0) {
    return (
      <div className="chart-no-data-card card">
        <p className="muted">{t("charts.noData")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="chart-legend-controls">
        <ButtonGroup size="small" variant="outlined">
          <Button
            onClick={() => setTemperatureMode("outdoor")}
            variant={temperatureMode === "outdoor" ? "contained" : "outlined"}
          >
            {t("common.outdoorTemperature")}
          </Button>
          <Button
            onClick={() => setTemperatureMode("flow")}
            variant={temperatureMode === "flow" ? "contained" : "outlined"}
          >
            {t("common.flowTemperature")}
          </Button>
          <Button
            onClick={() => setTemperatureMode("delta")}
            variant={temperatureMode === "delta" ? "contained" : "outlined"}
          >
            {t("charts.temperatureDelta")}
          </Button>
        </ButtonGroup>
      </div>
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
            if (node.serieId === t("charts.regressionCurve")) {
              return CHART_COLORS.regression;
            }
            // Check if this is the user's series (starts with translated myPrefix)
            const myPrefix = t("charts.myPrefix");
            if (typeof node.serieId === "string" && node.serieId.startsWith(myPrefix)) {
              return userColor;
            }
            // For base series, use gray if inactive, green if active
            if (node.serieId === azTotalKey) {
              return activeKey === azTotalKey ? barColor : CHART_COLORS.inactive;
            }
            if (node.serieId === azHeatingKey) {
              return activeKey === azHeatingKey ? barColor : CHART_COLORS.inactive;
            }
            // Fallback
            return barColor;
          }}
          nodeSize={(node) => {
            // Make regression curve points visible
            if (node.serieId === t("charts.regressionCurve")) {
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
            legend: getXAxisLabel(),
            legendPosition: "middle",
            legendOffset: 32,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: t("charts.azValue"),
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
                    {getXAxisLabel()}: <strong>{xValue.toFixed(1)}°C</strong>
                  </span>
                </div>
                <div className="chart-tooltip-item">
                  <div
                    className="chart-tooltip-indicator chart-tooltip-indicator-bar chart-tooltip-indicator-custom"
                    style={{ backgroundColor: dotColor }}
                  />
                  <span className="chart-tooltip-text">
                    {activeKey}: <strong>{yValue.toFixed(2)}</strong>
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
              data: legendItems,
              toggleSerie: false,
              // biome-ignore lint/suspicious/noExplicitAny: Nivo's onClick type expects MouseEvent parameter we don't need
              onClick: handleLegendClick as any,
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
                {t("charts.azTempStats")}
              </h3>
              <Tooltip title={statsExpanded ? t("charts.hideStats") : t("charts.showStats")}>
                <IconButton
                  size="small"
                  onClick={() => setStatsExpanded(!statsExpanded)}
                  sx={{ ml: 1, p: 0.5 }}
                >
                  {statsExpanded ? (
                    <ExpandLess fontSize="small" />
                  ) : (
                    <ExpandMore fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </div>
            {statsExpanded && (
              <div className="chart-stats-expanded">
                {/* Reference temperature predictions */}
                <div className="chart-stats-grid">
                  {getReferenceTemperatures(temperatureMode).map((temp) => {
                    const predictedCOP = loessSmoother(temp);
                    return (
                      <Tooltip key={temp} title={t("charts.predictedCopTooltip")} placement="top">
                        <div className="chart-stat-item">
                          <span className="chart-stat-label">
                            {t("common.az_short")} {temp}°C
                          </span>
                          <span className="chart-stat-value">{predictedCOP.toFixed(2)}</span>
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
    </>
  );
}
