import { type BarCustomLayerProps, ResponsiveBar } from "@nivo/bar";
import { useTranslation } from "react-i18next";
import { CHART_COLORS } from "../../../lib/chartTheme";

export interface CategoryBarChartRow {
  [key: string]: string | number;
  category: string;
  value: number;
  sampleSize: number;
}

interface CategoryBarChartProps {
  data: CategoryBarChartRow[];
  valueLabel: string;
  valueUnit: string;
  axisLabel?: string;
}

function SampleSizeLayer({ bars }: BarCustomLayerProps<CategoryBarChartRow>) {
  return (
    <g pointerEvents="none">
      {bars.map((bar) => {
        const sampleSize = bar.data.data.sampleSize;
        return (
          <text
            key={bar.key}
            x={bar.x + bar.width + 8}
            y={bar.y + bar.height / 2}
            dominantBaseline="central"
            fontSize={13}
            fill="currentColor"
          >
            n = {sampleSize}
          </text>
        );
      })}
    </g>
  );
}

export function CategoryBarChart({
  data,
  valueLabel,
  valueUnit,
  axisLabel,
}: CategoryBarChartProps) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return <div className="chart-no-data-card">{t("charts.noData")}</div>;
  }

  return (
    <div className="chart-container">
      <ResponsiveBar
        data={data}
        keys={["value"]}
        indexBy="category"
        layout="horizontal"
        margin={{ top: 10, right: 80, bottom: 55, left: 230 }}
        padding={0.3}
        borderRadius={4}
        colors={CHART_COLORS.primary}
        borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
        enableLabel={false}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          legend: axisLabel ?? valueLabel,
          legendPosition: "middle",
          legendOffset: 38,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 10,
          renderTick: ({ x, y, value }) => {
            const [firstLine, secondLine] = String(value).split("\n");
            return (
              <g transform={`translate(${x},${y})`}>
                <text x={-10} textAnchor="end" fontSize={12} fill="currentColor">
                  <tspan x={-10} dy={secondLine ? -3 : 4}>
                    {firstLine}
                  </tspan>
                  {secondLine && (
                    <tspan x={-10} dy={14} fill="var(--text-light-gray)">
                      {secondLine}
                    </tspan>
                  )}
                </text>
              </g>
            );
          },
        }}
        layers={["grid", "axes", "bars", SampleSizeLayer]}
        tooltip={({ indexValue, value, data: row }) => (
          <div className="chart-tooltip">
            <div className="chart-tooltip-header">{indexValue}</div>
            <div className="chart-tooltip-item">
              <span className="chart-tooltip-text">
                {valueLabel}:{" "}
                <strong>
                  {Number(value).toFixed(1)} {valueUnit}
                </strong>
              </span>
            </div>
            <div className="chart-tooltip-item">
              <span className="chart-tooltip-text">
                {t("charts.systems")}: <strong>{row.sampleSize}</strong>
              </span>
            </div>
          </div>
        )}
      />
    </div>
  );
}
