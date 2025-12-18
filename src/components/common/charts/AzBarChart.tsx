import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ResponsiveBar } from "@nivo/bar";

// Interface for data that can be displayed in the AZ chart
export interface ChartDataRow {
  [key: string]: string | number | null | undefined;
  az?: number | null;
  az_heating?: number | null;
  electrical_energy_kwh?: number | null;
  thermal_energy_kwh?: number | null;
  electrical_energy_heating_kwh?: number | null;
  thermal_energy_heating_kwh?: number | null;
}

interface AzBarChartProps {
  data: ChartDataRow[];
  indexField: string; // e.g., "month" or "date"
  indexLabel: string; // e.g., "common.month" or "common.date"
  indexValues?: string[]; // Optional: predefined index values like ["1", "2", ..., "12"] for months
  indexFormatter?: (value: string) => string; // Optional: format index labels (e.g., date formatting)
  aggregateData?: boolean; // If true, aggregate across multiple systems
  averageAz?: boolean; // If true, average AZ values instead of summing energies
  barColor?: string; // Optional: custom bar color (default: '#f47560')
}

export default function AzBarChart({
  data,
  indexField,
  indexLabel,
  indexValues,
  indexFormatter,
  aggregateData = true,
  averageAz = false,
  barColor = "#23a477ff",
}: AzBarChartProps) {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState<string>("");

  const azTotalKey = t("common.azTotal");
  const azHeatingKey = t("common.azHeating");

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    if (!aggregateData) {
      // Direct mapping without aggregation
      return data.map((item) => {
        const indexValue = item[indexField];
        const formattedIndex =
          indexFormatter && indexValue != null ? indexFormatter(String(indexValue)) : indexValue;
        return {
          [indexField]: formattedIndex,
          [azTotalKey]: item.az ? Number(item.az.toFixed(2)) : 0,
          [azHeatingKey]: item.az_heating ? Number(item.az_heating.toFixed(2)) : 0,
        };
      });
    }

    if (averageAz) {
      // Average AZ values across systems for each index
      const grouped: Record<
        string,
        {
          az_values: number[];
          az_heating_values: number[];
        }
      > = {};

      for (const r of data) {
        const indexValue = r[indexField];
        if (indexValue == null) continue; // Skip null/undefined index values
        const key = String(indexValue);

        if (!grouped[key]) {
          grouped[key] = { az_values: [], az_heating_values: [] };
        }

        if (r.az !== undefined && r.az !== null && r.az > 0) {
          grouped[key].az_values.push(r.az);
        }
        if (r.az_heating !== undefined && r.az_heating !== null && r.az_heating > 0) {
          grouped[key].az_heating_values.push(r.az_heating);
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

          return {
            [indexField]: indexFormatter ? indexFormatter(idx) : idx,
            [azTotalKey]: azAvg ? Number(azAvg.toFixed(2)) : 0,
            [azHeatingKey]: azHeatingAvg ? Number(azHeatingAvg.toFixed(2)) : 0,
          };
        })
        .filter(
          (d) => ((d[azTotalKey] as number) || 0) > 0 || ((d[azHeatingKey] as number) || 0) > 0,
        );
    }

    // Aggregate across multiple systems by summing energies
    const grouped: Record<
      string,
      {
        e_cons_total: number;
        e_prod_total: number;
        e_cons_h: number;
        e_prod_h: number;
      }
    > = {};

    for (const r of data) {
      const indexValue = r[indexField];
      if (indexValue == null) continue; // Skip null/undefined index values
      const key = String(indexValue);

      if (!grouped[key]) {
        grouped[key] = { e_cons_total: 0, e_prod_total: 0, e_cons_h: 0, e_prod_h: 0 };
      }

      const e_cons_h = r.electrical_energy_heating_kwh ?? 0;
      const e_prod_h = r.thermal_energy_heating_kwh ?? 0;
      const e_cons_total = r.electrical_energy_kwh ?? 0;
      const e_prod_total = r.thermal_energy_kwh ?? 0;

      grouped[key].e_cons_h += e_cons_h;
      grouped[key].e_prod_h += e_prod_h;
      grouped[key].e_cons_total += e_cons_total;
      grouped[key].e_prod_total += e_prod_total;
    }

    // Use provided index values or extract from grouped data
    const indices = indexValues || Object.keys(grouped).sort();

    return indices
      .map((idx) => {
        const d = grouped[idx];
        if (!d)
          return {
            [indexField]: indexFormatter ? indexFormatter(idx) : idx,
            [azTotalKey]: 0,
            [azHeatingKey]: 0,
          };

        const az = d.e_cons_total > 0 ? d.e_prod_total / d.e_cons_total : 0;
        const azHeating = d.e_cons_h > 0 ? d.e_prod_h / d.e_cons_h : 0;

        return {
          [indexField]: indexFormatter ? indexFormatter(idx) : idx,
          [azTotalKey]: az ? Number(az.toFixed(2)) : 0,
          [azHeatingKey]: azHeating ? Number(azHeating.toFixed(2)) : 0,
        };
      })
      .filter(
        (d) => ((d[azTotalKey] as number) || 0) > 0 || ((d[azHeatingKey] as number) || 0) > 0,
      );
  }, [
    data,
    indexField,
    indexValues,
    indexFormatter,
    aggregateData,
    averageAz,
    azTotalKey,
    azHeatingKey,
  ]);

  const handleLegendClick = (datum: { id: string }) => {
    // Toggle to the clicked key
    setActiveKey(datum.id);
  };

  // Default active key based on translation
  const defaultActiveKey = t("common.azHeating");
  const currentActiveKey = activeKey || defaultActiveKey;

  return (
    <div style={{ height: 400, marginTop: 20, marginBottom: 10 }} className="card">
      {chartData.length > 0 ? (
        <ResponsiveBar
          // biome-ignore lint/suspicious/noExplicitAny: Nivo's BarDatum type is too strict for our flexible data structure
          data={chartData as any}
          keys={[currentActiveKey]}
          indexBy={indexField}
          margin={{ top: 10, right: 20, bottom: 60, left: 50 }}
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
              ],
              anchor: "bottom",
              direction: "row",
              justify: false,
              translateX: 60,
              translateY: 60,
              itemsSpacing: 2,
              itemWidth: 200,
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
