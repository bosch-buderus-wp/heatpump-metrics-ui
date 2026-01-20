import { ResponsiveBar } from "@nivo/bar";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useChartLegend } from "../../../hooks/useChartLegend";
import {
  calculateSystemAz,
  createHistogramBins,
  type SystemAzData,
} from "../../../lib/chartDataProcessing";
import { CHART_COLORS } from "../../../lib/chartTheme";
import {
  filterRealisticDataForCharts,
  filterSystemsByRealisticCOP,
} from "../../../lib/dataQuality";

export interface HistogramBin {
  binLabel: string;
  binStart: number;
  binEnd: number;
  count: number;
  countHeating: number;
  systemIds?: string[];
  systemIdsHeating?: string[];
}

// Input data type for histogram
interface HistogramDataRow {
  heating_id: string;
  thermal_energy_kwh?: number | null;
  electrical_energy_kwh?: number | null;
  thermal_energy_heating_kwh?: number | null;
  electrical_energy_heating_kwh?: number | null;
}

interface HistogramChartProps {
  data: HistogramDataRow[];
  metricMode?: "cop" | "energy";
  statsTitle?: string;
  binSize?: number;
}

export function HistogramChart({
  data,
  metricMode = "cop",
  statsTitle,
  binSize = 0.5,
}: HistogramChartProps) {
  const { t } = useTranslation();
  const barColor = CHART_COLORS.primary;

  // Use different labels based on metric mode
  const totalKey =
    metricMode === "energy" ? t("charts.electricalEnergyTotal") : t("common.azTotal");
  const heatingKey =
    metricMode === "energy" ? t("charts.electricalEnergyHeating") : t("common.azHeating");

  // Calculate histogram data based on metric mode
  const histogramData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalBins: [],
        heatingBins: [],
        totalStats: { mean: 0, median: 0, min: 0, max: 0, count: 0 },
        heatingStats: { mean: 0, median: 0, min: 0, max: 0, count: 0 },
      };
    }

    if (metricMode === "energy") {
      // Filter out unrealistic data first
      const filteredData = filterRealisticDataForCharts(data);

      // Sum energy values per system
      const systemTotals = new Map<
        string,
        { thermal: number; electrical: number; thermalHeating: number; electricalHeating: number }
      >();

      filteredData.forEach((row) => {
        const existing = systemTotals.get(row.heating_id) || {
          thermal: 0,
          electrical: 0,
          thermalHeating: 0,
          electricalHeating: 0,
        };
        existing.thermal += row.thermal_energy_kwh || 0;
        existing.electrical += row.electrical_energy_kwh || 0;
        existing.thermalHeating += row.thermal_energy_heating_kwh || 0;
        existing.electricalHeating += row.electrical_energy_heating_kwh || 0;
        systemTotals.set(row.heating_id, existing);
      });

      // Convert to SystemAzData format
      const systemData: SystemAzData[] = [];
      systemTotals.forEach((totals, heatingId) => {
        systemData.push({
          heatingId,
          az: totals.electrical,
          azHeating: totals.electricalHeating,
          thermalTotal: totals.thermal,
          electricalTotal: totals.electrical,
          thermalHeatingTotal: totals.thermalHeating,
          electricalHeatingTotal: totals.electricalHeating,
        });
      });

      // Filter out systems with unrealistic COP values calculated from energy data
      // In energy mode, az fields contain energy values, not COP, so don't check them
      const filteredSystemData = filterSystemsByRealisticCOP(systemData, false);

      // Calculate appropriate bin size based on data range
      // For energy data, we need much larger bins than COP data
      let energyBinSize = binSize; // Use provided binSize if it's already set for energy

      // If binSize is still the default COP size (0.5), calculate appropriate energy bin size
      if (binSize <= 1 && filteredSystemData.length > 0) {
        // Find min and max values to determine appropriate bin size
        const values = filteredSystemData
          .map((s) => s.az)
          .filter((v): v is number => v !== null && v > 0);
        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          const range = max - min;

          // Aim for roughly 10-20 bins
          energyBinSize = Math.max(50, Math.ceil(range / 15 / 50) * 50); // Round to nearest 50 kWh
        } else {
          energyBinSize = 50; // Default: 50 kWh bins
        }
      }

      const totalHistogram = createHistogramBins(filteredSystemData, "az", energyBinSize, true);
      const heatingHistogram = createHistogramBins(
        filteredSystemData,
        "azHeating",
        energyBinSize,
        true,
      );

      return {
        totalBins: totalHistogram.bins,
        heatingBins: heatingHistogram.bins,
        totalStats: totalHistogram.stats,
        heatingStats: heatingHistogram.stats,
      };
    }

    // COP mode: calculate AZ, then filter unrealistic calculated values
    const filteredData = filterRealisticDataForCharts(data);
    const systemAzData = calculateSystemAz(filteredData);

    // Filter out systems with unrealistic calculated COP values
    const filteredSystemAzData = filterSystemsByRealisticCOP(systemAzData);

    const totalHistogram = createHistogramBins(filteredSystemAzData, "az", binSize);
    const heatingHistogram = createHistogramBins(filteredSystemAzData, "azHeating", binSize);

    return {
      totalBins: totalHistogram.bins,
      heatingBins: heatingHistogram.bins,
      totalStats: totalHistogram.stats,
      heatingStats: heatingHistogram.stats,
    };
  }, [data, metricMode, binSize]);

  // Use the chart legend hook (histogram doesn't need temperature lines, only toggles)
  const { activeKey, legendItems, handleLegendClick } = useChartLegend({
    azTotalKey: totalKey,
    azHeatingKey: heatingKey,
    barColor,
    outdoorTempLabel: t("common.outdoorTemperature"),
    flowTempLabel: t("common.flowTemperature"),
    showTemperatureLines: false, // Histogram doesn't show temperature lines
  });

  // Determine which data to show based on active key
  const { chartData, stats } = useMemo(() => {
    if (activeKey === totalKey) {
      return { chartData: histogramData.totalBins, stats: histogramData.totalStats };
    }
    return { chartData: histogramData.heatingBins, stats: histogramData.heatingStats };
  }, [activeKey, histogramData, totalKey]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="chart-no-data-card card">
        <p className="muted">{t("charts.noData")}</p>
      </div>
    );
  }

  return (
    <div className="chart-container card">
      <ResponsiveBar
        // biome-ignore lint/suspicious/noExplicitAny: Nivo's BarDatum type is too strict for our flexible data structure
        data={chartData as any}
        keys={["count"]}
        indexBy="binLabel"
        margin={{ top: 10, right: 60, bottom: 70, left: 50 }}
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
          legend: metricMode === "energy" ? t("charts.electricalEnergyTotal") : t("charts.azValue"),
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
              {metricMode === "energy" ? t("charts.electricalEnergyTotal") : t("common.az")}:{" "}
              {indexValue}
              {metricMode === "energy" ? " kWh" : ""}
            </div>
            <div className="chart-tooltip-item">
              <div
                className="chart-tooltip-indicator chart-tooltip-indicator-bar chart-tooltip-indicator-custom"
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
            translateY: 70,
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
            <span className="chart-stat-value">
              {metricMode === "energy" ? `${Math.round(stats.mean)} kWh` : stats.mean.toFixed(2)}
            </span>
          </div>
          <div className="chart-stat-item">
            <span className="chart-stat-label">{t("charts.median")}</span>
            <span className="chart-stat-value">
              {metricMode === "energy"
                ? `${Math.round(stats.median)} kWh`
                : stats.median.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
