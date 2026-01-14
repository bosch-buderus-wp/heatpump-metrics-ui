import { ResponsiveBar } from "@nivo/bar";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useChartLegend } from "../../../hooks/useChartLegend";
import {
  calculateTemperatureScale,
  mergeComparisonDatasets,
  processDataset,
} from "../../../lib/chartDataProcessing";
import { CHART_COLORS } from "../../../lib/chartTheme";
import { filterRealisticDataForCharts } from "../../../lib/dataQuality";
import ChartTooltip from "./ChartTooltip";
import TemperatureLineLayer from "./TemperatureLineLayer";

// Metric mode for the chart
export type MetricMode = "cop" | "energy";

// Interface for data that can be displayed in the AZ chart
export interface ChartDataRow {
  [key: string]: string | number | null | undefined;
  az?: number | null;
  az_heating?: number | null;
  electrical_energy_kwh?: number | null;
  electrical_energy_heating_kwh?: number | null;
  outdoor_temperature_c?: number | null;
  flow_temperature_c?: number | null;
}

export interface ComparisonDataGroup {
  id: string;
  name: string;
  color: string;
  data: ChartDataRow[];
}

interface AzBarChartProps {
  data: ChartDataRow[];
  indexField: string; // e.g., "month" or "date"
  indexLabel: string; // e.g., "common.month" or "common.date"
  indexValues?: string[]; // Optional: predefined index values like ["1", "2", ..., "12"] for months
  indexFormatter?: (value: string) => string; // Optional: format index labels (e.g., date formatting)
  aggregateData?: boolean; // If true, aggregate (average) AZ values across multiple systems
  barColor?: string; // Optional: custom bar color (default: '#f47560')
  metricMode?: MetricMode; // "cop" or "energy" - determines what to display
  // Comparison mode
  comparisonGroups?: ComparisonDataGroup[]; // If provided, shows multiple data groups for comparison
}

export default function AzBarChart({
  data,
  indexField,
  indexLabel,
  indexValues,
  indexFormatter,
  aggregateData = true,
  barColor = CHART_COLORS.primary,
  metricMode = "cop",
  comparisonGroups,
}: AzBarChartProps) {
  const { t } = useTranslation();

  // Use different labels based on metric mode
  const azTotalKey =
    metricMode === "energy" ? t("charts.electricalEnergyTotal") : t("common.azTotal");
  const azHeatingKey =
    metricMode === "energy" ? t("charts.electricalEnergyHeating") : t("common.azHeating");

  // Determine if we're in comparison mode
  const isComparisonMode = comparisonGroups && comparisonGroups.length > 1;

  // Chart legend management
  const { showOutdoorTemp, showFlowTemp, chartKeys, legendItems, handleLegendClick } =
    useChartLegend({
      azTotalKey,
      azHeatingKey,
      barColor,
      isComparisonMode,
      comparisonGroups,
      outdoorTempLabel: t("common.outdoorTemperature"),
      flowTempLabel: t("common.flowTemperature"),
    });

  // Process chart data
  const chartData = useMemo(() => {
    // Comparison mode: merge multiple datasets
    if (isComparisonMode && comparisonGroups) {
      // Filter unrealistic data from each comparison group
      const filteredGroups = comparisonGroups.map((group) => ({
        ...group,
        data: filterRealisticDataForCharts(group.data),
      }));

      return mergeComparisonDatasets(filteredGroups, {
        indexField,
        indexFormatter,
        indexValues,
        azTotalKey,
        azHeatingKey,
        aggregateData,
        metricMode,
      });
    }

    // Normal mode: single dataset
    if (!data || data.length === 0) return [];

    // Filter out unrealistic data before processing
    const realisticData = filterRealisticDataForCharts(data);

    const processed = processDataset(realisticData, {
      indexField,
      indexFormatter,
      indexValues,
      azTotalKey,
      azHeatingKey,
      aggregateData,
      metricMode,
    });

    // Filter out entries with no values
    return processed.filter(
      (d) => ((d[azTotalKey] as number) || 0) > 0 || ((d[azHeatingKey] as number) || 0) > 0,
    );
  }, [
    data,
    indexField,
    indexValues,
    indexFormatter,
    aggregateData,
    azTotalKey,
    azHeatingKey,
    metricMode,
    isComparisonMode,
    comparisonGroups,
  ]);

  // Color function for bars
  // biome-ignore lint/suspicious/noExplicitAny: Nivo's bar type is not well-typed
  const getBarColor = (bar: any) => {
    if (isComparisonMode && comparisonGroups) {
      const groupIndex = comparisonGroups.findIndex((g) => bar.id.includes(`(${g.name})`));
      return groupIndex >= 0 ? comparisonGroups[groupIndex].color : barColor;
    }
    return barColor;
  };

  // Calculate temperature scale (right Y-axis)
  const tempScale = useMemo(() => calculateTemperatureScale(chartData), [chartData]);

  // Wrapper for the temperature line layer that passes necessary props
  // biome-ignore lint/suspicious/noExplicitAny: Nivo's layer props are complex and not well-typed
  const temperatureLineLayer = (props: any) => (
    <TemperatureLineLayer
      {...props}
      chartData={chartData}
      tempScale={tempScale}
      showOutdoorTemp={showOutdoorTemp}
      showFlowTemp={showFlowTemp}
    />
  );

  // Custom tooltip to show AZ and temperature values
  // biome-ignore lint/suspicious/noExplicitAny: Nivo's tooltip props are complex and not well-typed
  const customTooltip = ({ id, value, color, indexValue }: any) => {
    const dataPoint = chartData.find((d) => d[indexField] === indexValue);
    return (
      <ChartTooltip
        id={id}
        value={value}
        color={color}
        indexValue={indexValue}
        outdoorTemp={dataPoint?.outdoor_temp as number | null | undefined}
        flowTemp={dataPoint?.flow_temp as number | null | undefined}
        metricMode={metricMode}
      />
    );
  };

  return (
    <div style={{ height: 400, marginTop: 20, marginBottom: 10 }} className="card">
      {chartData.length > 0 ? (
        <ResponsiveBar
          // biome-ignore lint/suspicious/noExplicitAny: Nivo's BarDatum type is too strict for our flexible data structure
          data={chartData as any}
          keys={chartKeys}
          indexBy={indexField}
          margin={{ top: 10, right: 60, bottom: 60, left: 50 }}
          padding={0.3}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={getBarColor}
          defs={[
            {
              id: "dots",
              type: "patternDots",
              background: "inherit",
              color: "#38bcb2",
              size: 4,
              padding: 1,
              stagger: true,
            },
            {
              id: "lines",
              type: "patternLines",
              background: "inherit",
              color: "#eed312",
              rotation: -45,
              lineWidth: 6,
              spacing: 10,
            },
          ]}
          borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: t(indexLabel),
            legendPosition: "middle",
            legendOffset: 32,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: metricMode === "energy" ? t("charts.electricalEnergyTotal") : t("common.az"),
            legendPosition: "middle",
            legendOffset: -40,
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
          layers={[
            "grid",
            "axes",
            "bars",
            "markers",
            "legends",
            "annotations",
            temperatureLineLayer,
          ]}
          tooltip={customTooltip}
          legends={[
            {
              dataFrom: "keys",
              data: legendItems,
              anchor: "bottom",
              direction: "row",
              justify: false,
              translateX: 0,
              translateY: 60,
              itemsSpacing: 2,
              itemWidth: 180,
              itemHeight: 20,
              itemDirection: "left-to-right",
              itemOpacity: 0.85,
              symbolSize: 20,
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
          role="application"
          ariaLabel="COP Chart"
          groupMode={isComparisonMode ? "grouped" : "grouped"}
        />
      ) : (
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {t("common.noData")}
        </div>
      )}
    </div>
  );
}
