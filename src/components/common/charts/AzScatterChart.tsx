import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Button, ButtonGroup, IconButton, Tooltip } from "@mui/material";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useChartLegend } from "../../../hooks/useChartLegend";
import { computeAzTemperatureRegression } from "../../../lib/chartDataProcessing";
import type { RegressionResult } from "../../../lib/regressionUtils";
import { generateCurvePoints } from "../../../lib/regressionUtils";

export interface ScatterDataPoint {
  az?: number | null;
  az_heating?: number | null;
  outdoor_temperature_c?: number | null;
  flow_temperature_c?: number | null;
  heating_id?: string | null;
  name?: string | null;
  date?: string | null;
}

// Extended type for scatter plot points with custom data
interface ScatterPointData {
  x: number;
  y: number;
  heating_id?: string | null;
  name?: string | null;
  date?: string | null;
}

type TemperatureMode = "outdoor" | "flow" | "delta";

interface AzScatterChartProps {
  data: ScatterDataPoint[];
}

export function AzScatterChart({ data }: AzScatterChartProps) {
  const { t } = useTranslation();
  const barColor = "#23a477ff";

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

  // Calculate predicted COP at given temperature
  const predictCOP = (regression: RegressionResult, temperature: number): number => {
    return regression.slope * temperature + regression.intercept;
  };

  // Use the chart legend hook (same as AzBarChart)
  const { activeKey, legendItems, handleLegendClick } = useChartLegend({
    azTotalKey,
    azHeatingKey,
    barColor,
    outdoorTempLabel: t("common.outdoorTemperature"),
    flowTempLabel: t("common.flowTemperature"),
  });

  // Transform data for scatter plot - create both series but only populate the active one
  const { scatterData, regression } = useMemo(() => {
    if (!data || data.length === 0) return { scatterData: [], activePoints: [], regression: null };

    // Determine which AZ values to use based on active key
    const useAzHeating = activeKey === azHeatingKey;

    // Filter and transform data points
    const points = data
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
          };
        }
        return null;
      })
      .filter((p) => p !== null);

    // Compute regression on the active points
    const regressionResult = computeAzTemperatureRegression(points);

    // Generate curve points if regression is valid
    let curveData: ScatterPointData[] = [];
    if (regressionResult && points.length > 0) {
      const xValues = points.map((p) => p.x);
      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      const curvePoints = generateCurvePoints(regressionResult, xMin, xMax, 50);
      curveData = curvePoints.map((p) => ({ x: p.x, y: p.y }));
    }

    // Return scatter series with curve overlay
    const scatterSeries = [
      {
        id: azTotalKey,
        data: activeKey === azTotalKey ? points : [],
      },
      {
        id: azHeatingKey,
        data: activeKey === azHeatingKey ? points : [],
      },
    ];

    // Add curve as a separate series if available (use translation key)
    if (curveData.length > 0) {
      scatterSeries.push({
        id: t("charts.regressionCurve"),
        data: curveData.map((p) => ({
          ...p,
          heating_id: undefined,
          name: undefined,
          date: undefined,
        })),
      });
    }

    return {
      scatterData: scatterSeries,
      activePoints: points as ScatterPointData[],
      regression: regressionResult,
    };
  }, [data, activeKey, azHeatingKey, azTotalKey, temperatureMode, t]);

  // Filter legend items to only show AZ toggles (not temperature lines)
  // Temperature line items have IDs "outdoor_temp" and "flow_temp"
  const azLegendItems = useMemo(() => {
    return legendItems.filter((item) => item.id !== "outdoor_temp" && item.id !== "flow_temp");
  }, [legendItems]);

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
      <div
        style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}
        className="card"
      >
        <p className="muted">{t("charts.noData")}</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginTop: 20, marginBottom: 10, display: "flex", justifyContent: "center" }}>
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
      <div
        style={{ height: 400, marginTop: 10, marginBottom: 10, position: "relative" }}
        className="card"
      >
        <ResponsiveScatterPlot
          // biome-ignore lint/suspicious/noExplicitAny: Nivo's ScatterPlot type is complex
          data={scatterData as any}
          margin={{ top: 10, right: 60, bottom: 60, left: 60 }}
          xScale={{ type: "linear", min: "auto", max: "auto" }}
          yScale={{ type: "linear", min: "auto", max: "auto" }}
          blendMode="normal"
          colors={(node) => {
            // Color nodes based on which series they belong to
            if (node.serieId === t("charts.regressionCurve")) {
              return "#ff6b6b"; // Red color for regression line
            }
            if (node.serieId === activeKey) {
              return barColor;
            }
            return "#cccccc"; // Shouldn't happen since inactive series has no data
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
            legendOffset: 30,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: t("charts.azValue"),
            legendPosition: "middle",
            legendOffset: -50,
          }}
          tooltip={({ node }) => {
            const pointData = node.data as ScatterPointData;
            const xValue = typeof pointData.x === "number" ? pointData.x : 0;
            const yValue = typeof pointData.y === "number" ? pointData.y : 0;

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
                    className="chart-tooltip-indicator chart-tooltip-indicator-bar"
                    style={{ backgroundColor: barColor }}
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
              translateY: 60,
              itemsSpacing: 20,
              itemWidth: 200,
              itemHeight: 20,
              itemDirection: "left-to-right",
              itemOpacity: 0.85,
              symbolSize: 20,
              symbolShape: "circle",
              data: azLegendItems,
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
        {regression && (
          <div
            className="chart-stats"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              transition: "all 0.3s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 className="chart-stats-title" style={{ margin: 0 }}>
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
              <div style={{ marginTop: 8 }}>
                {/* Reference temperature predictions */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "8px",
                  }}
                >
                  {getReferenceTemperatures(temperatureMode).map((temp) => {
                    const predictedCOP = predictCOP(regression, temp);
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
