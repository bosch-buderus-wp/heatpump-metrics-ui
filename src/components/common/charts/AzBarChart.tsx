import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ResponsiveBar } from "@nivo/bar";
import TemperatureLineLayer from "./TemperatureLineLayer";
import ChartTooltip from "./ChartTooltip";

// Interface for data that can be displayed in the AZ chart
export interface ChartDataRow {
  [key: string]: string | number | null | undefined;
  az?: number | null;
  az_heating?: number | null;
  outdoor_temperature_c?: number | null;
  flow_temperature_c?: number | null;
}

interface AzBarChartProps {
  data: ChartDataRow[];
  indexField: string; // e.g., "month" or "date"
  indexLabel: string; // e.g., "common.month" or "common.date"
  indexValues?: string[]; // Optional: predefined index values like ["1", "2", ..., "12"] for months
  indexFormatter?: (value: string) => string; // Optional: format index labels (e.g., date formatting)
  aggregateData?: boolean; // If true, aggregate (average) AZ values across multiple systems
  barColor?: string; // Optional: custom bar color (default: '#f47560')
}

export default function AzBarChart({
  data,
  indexField,
  indexLabel,
  indexValues,
  indexFormatter,
  aggregateData = true,
  barColor = "#23a477ff",
}: AzBarChartProps) {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState<string>("");
  const [showOutdoorTemp, setShowOutdoorTemp] = useState<boolean>(true);
  const [showFlowTemp, setShowFlowTemp] = useState<boolean>(true);

  const azTotalKey = t("common.azTotal");
  const azHeatingKey = t("common.azHeating");

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    if (!aggregateData) {
      // Direct mapping without aggregation - pass through AZ values as-is
      return data.map((item) => {
        const indexValue = item[indexField];
        const formattedIndex =
          indexFormatter && indexValue != null ? indexFormatter(String(indexValue)) : indexValue;
        return {
          [indexField]: formattedIndex,
          [azTotalKey]: item.az ? Number(item.az.toFixed(2)) : 0,
          [azHeatingKey]: item.az_heating ? Number(item.az_heating.toFixed(2)) : 0,
          outdoor_temp: item.outdoor_temperature_c
            ? Number(item.outdoor_temperature_c.toFixed(1))
            : null,
          flow_temp: item.flow_temperature_c ? Number(item.flow_temperature_c.toFixed(1)) : null,
        };
      });
    }

    // Aggregate data: average AZ values across multiple systems for each index
    const grouped: Record<
      string,
      {
        az_values: number[];
        az_heating_values: number[];
        outdoor_temp_values: number[];
        flow_temp_values: number[];
      }
    > = {};

    for (const r of data) {
      const indexValue = r[indexField];
      if (indexValue == null) continue; // Skip null/undefined index values
      const key = String(indexValue);

      if (!grouped[key]) {
        grouped[key] = {
          az_values: [],
          az_heating_values: [],
          outdoor_temp_values: [],
          flow_temp_values: [],
        };
      }

      if (r.az !== undefined && r.az !== null && r.az > 0) {
        grouped[key].az_values.push(r.az);
      }
      if (r.az_heating !== undefined && r.az_heating !== null && r.az_heating > 0) {
        grouped[key].az_heating_values.push(r.az_heating);
      }
      if (r.outdoor_temperature_c !== undefined && r.outdoor_temperature_c !== null) {
        grouped[key].outdoor_temp_values.push(r.outdoor_temperature_c);
      }
      if (r.flow_temperature_c !== undefined && r.flow_temperature_c !== null) {
        grouped[key].flow_temp_values.push(r.flow_temperature_c);
      }
    }

    // Use provided index values or extract from grouped data
    const indices = indexValues || Object.keys(grouped).sort();

    return indices
      .map((idx) => {
        const d = grouped[idx];
        if (!d || (d.az_values.length === 0 && d.az_heating_values.length === 0)) {
          return {
            [indexField]: indexFormatter ? indexFormatter(idx) : idx,
            [azTotalKey]: 0,
            [azHeatingKey]: 0,
            outdoor_temp: null,
            flow_temp: null,
          };
        }

        const azAvg =
          d.az_values.length > 0
            ? d.az_values.reduce((sum, val) => sum + val, 0) / d.az_values.length
            : 0;
        const azHeatingAvg =
          d.az_heating_values.length > 0
            ? d.az_heating_values.reduce((sum, val) => sum + val, 0) / d.az_heating_values.length
            : 0;
        const outdoorTempAvg =
          d.outdoor_temp_values.length > 0
            ? d.outdoor_temp_values.reduce((sum, val) => sum + val, 0) /
              d.outdoor_temp_values.length
            : null;
        const flowTempAvg =
          d.flow_temp_values.length > 0
            ? d.flow_temp_values.reduce((sum, val) => sum + val, 0) / d.flow_temp_values.length
            : null;

        return {
          [indexField]: indexFormatter ? indexFormatter(idx) : idx,
          [azTotalKey]: azAvg ? Number(azAvg.toFixed(2)) : 0,
          [azHeatingKey]: azHeatingAvg ? Number(azHeatingAvg.toFixed(2)) : 0,
          outdoor_temp: outdoorTempAvg !== null ? Number(outdoorTempAvg.toFixed(2)) : null,
          flow_temp: flowTempAvg !== null ? Number(flowTempAvg.toFixed(2)) : null,
        };
      })
      .filter(
        (d) => ((d[azTotalKey] as number) || 0) > 0 || ((d[azHeatingKey] as number) || 0) > 0,
      );
  }, [data, indexField, indexValues, indexFormatter, aggregateData, azTotalKey, azHeatingKey]);

  const handleLegendClick = (datum: { id: string }) => {
    // Handle temperature line toggles
    if (datum.id === "outdoor_temp") {
      setShowOutdoorTemp(!showOutdoorTemp);
      return;
    }
    if (datum.id === "flow_temp") {
      setShowFlowTemp(!showFlowTemp);
      return;
    }
    // Toggle to the clicked key for AZ bars
    setActiveKey(datum.id);
  };

  // Calculate temperature scale (right Y-axis)
  const tempScale = useMemo(() => {
    if (!chartData || chartData.length === 0) return { min: 0, max: 40 };

    const allTemps: number[] = [];
    chartData.forEach((d) => {
      if (typeof d.outdoor_temp === "number") allTemps.push(d.outdoor_temp);
      if (typeof d.flow_temp === "number") allTemps.push(d.flow_temp);
    });

    if (allTemps.length === 0) return { min: 0, max: 40 };

    const min = Math.min(...allTemps);
    const max = Math.max(...allTemps);
    const padding = (max - min) * 0.1 || 5;

    return { min: Math.floor(min - padding), max: Math.ceil(max + padding) };
  }, [chartData]);

  // Wrapper for the temperature line layer that passes necessary props
  const temperatureLineLayer = (props: any) => (
    <TemperatureLineLayer
      {...props}
      chartData={chartData}
      tempScale={tempScale}
      showOutdoorTemp={showOutdoorTemp}
      showFlowTemp={showFlowTemp}
    />
  );

  // Default active key based on translation
  const defaultActiveKey = t("common.azHeating");
  const currentActiveKey = activeKey || defaultActiveKey;

  // Custom tooltip to show AZ and temperature values
  const customTooltip = ({ id, value, color, indexValue }: any) => {
    // Find the data point for this bar
    const dataPoint = chartData.find((d) => d[indexField] === indexValue);

    return (
      <ChartTooltip
        id={id}
        value={value}
        color={color}
        indexValue={indexValue}
        outdoorTemp={dataPoint?.outdoor_temp}
        flowTemp={dataPoint?.flow_temp}
      />
    );
  };

  return (
    <div style={{ height: 400, marginTop: 20, marginBottom: 10 }} className="card">
      {chartData.length > 0 ? (
        <ResponsiveBar
          // biome-ignore lint/suspicious/noExplicitAny: Nivo's BarDatum type is too strict for our flexible data structure
          data={chartData as any}
          keys={[currentActiveKey]}
          indexBy={indexField}
          margin={{ top: 10, right: 60, bottom: 60, left: 50 }}
          padding={0.3}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={() => barColor}
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
            legend: t("common.az"),
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
              data: [
                {
                  id: azTotalKey,
                  label: azTotalKey,
                  color: currentActiveKey === azTotalKey ? barColor : "#cccccc",
                },
                {
                  id: azHeatingKey,
                  label: azHeatingKey,
                  color: currentActiveKey === azHeatingKey ? barColor : "#cccccc",
                },
                {
                  id: "outdoor_temp",
                  label: t("common.outdoorTemperature"),
                  color: showOutdoorTemp ? "#3b82f6" : "#cccccc",
                },
                {
                  id: "flow_temp",
                  label: t("common.flowTemperature"),
                  color: showFlowTemp ? "#ef4444" : "#cccccc",
                },
              ],
              anchor: "bottom",
              direction: "row",
              justify: false,
              translateX: 0,
              translateY: 60,
              itemsSpacing: 2,
              itemWidth: 150,
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
          groupMode="grouped"
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
