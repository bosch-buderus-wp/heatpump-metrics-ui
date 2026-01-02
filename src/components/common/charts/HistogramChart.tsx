import { ResponsiveBar } from "@nivo/bar";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface HistogramBin {
  binLabel: string;
  binStart: number;
  binEnd: number;
  count: number;
  countHeating: number;
  systemIds?: string[];
  systemIdsHeating?: string[];
}

interface HistogramChartProps {
  azBins: HistogramBin[];
  azHeatingBins: HistogramBin[];
  azStats: { mean: number; median: number };
  azHeatingStats: { mean: number; median: number };
  statsTitle?: string;
}

export function HistogramChart({
  azBins,
  azHeatingBins,
  azStats,
  azHeatingStats,
  statsTitle,
}: HistogramChartProps) {
  const { t } = useTranslation();
  const barColor = "#23a477ff";

  const azTotalKey = t("common.azTotal");
  const azHeatingKey = t("common.azHeating");

  // Track which AZ type is active (default to azHeating like in AzBarChart)
  const [activeKey, setActiveKey] = useState<string>("");
  const currentActiveKey = activeKey || azHeatingKey;

  // Determine which data to show based on active key
  const { chartData, stats } = useMemo(() => {
    if (currentActiveKey === azTotalKey) {
      return { chartData: azBins, stats: azStats };
    }
    return { chartData: azHeatingBins, stats: azHeatingStats };
  }, [currentActiveKey, azBins, azHeatingBins, azStats, azHeatingStats, azTotalKey]);

  // Handle legend clicks
  const handleLegendClick = useCallback((datum: { id: string }) => {
    setActiveKey(datum.id);
  }, []);

  // Generate legend items
  const legendItems = useMemo(() => {
    return [
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
    ];
  }, [azTotalKey, azHeatingKey, currentActiveKey]);

  if (!chartData || chartData.length === 0) {
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
    <div style={{ height: 400, marginTop: 20, marginBottom: 10 }} className="card">
      <ResponsiveBar
        // biome-ignore lint/suspicious/noExplicitAny: Nivo's BarDatum type is too strict for our flexible data structure
        data={chartData as any}
        keys={["count"]}
        indexBy="binLabel"
        margin={{ top: 10, right: 60, bottom: 60, left: 50 }}
        padding={0.3}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        colors={barColor}
        borderColor={{
          from: "color",
          modifiers: [["darker", 1.6]],
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          legend: t("charts.azValue"),
          legendPosition: "middle",
          legendOffset: 30,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: t("charts.systems"),
          legendPosition: "middle",
          legendOffset: -40,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{
          from: "color",
          modifiers: [["darker", 1.6]],
        }}
        tooltip={({ indexValue, value }) => (
          <div className="chart-tooltip">
            <div className="chart-tooltip-header">
              {t("common.az")}: {indexValue}
            </div>
            <div className="chart-tooltip-item">
              <div
                className="chart-tooltip-indicator chart-tooltip-indicator-bar"
                style={{ backgroundColor: barColor }}
              />
              <span className="chart-tooltip-text">
                {t("charts.systems")}: <strong>{value}</strong>
              </span>
            </div>
          </div>
        )}
        legends={[
          {
            dataFrom: "keys",
            data: legendItems,
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
        ariaLabel="COP Histogram"
      />
      <div className="chart-stats">
        {statsTitle && <h3 className="chart-stats-title">{statsTitle}</h3>}
        <div>
          <div className="chart-stat-item">
            <span className="chart-stat-label">{t("charts.mean")}</span>
            <span className="chart-stat-value">{stats.mean.toFixed(2)}</span>
          </div>
          <div className="chart-stat-item">
            <span className="chart-stat-label">{t("charts.median")}</span>
            <span className="chart-stat-value">{stats.median.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
