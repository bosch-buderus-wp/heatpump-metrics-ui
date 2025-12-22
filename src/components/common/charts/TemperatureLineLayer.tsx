import { useTranslation } from "react-i18next";

interface TemperatureLineLayerProps {
  bars: any[];
  xScale: any;
  yScale: any;
  innerWidth: number;
  innerHeight: number;
  chartData: Array<{
    [key: string]: any;
    outdoor_temp?: number | null;
    flow_temp?: number | null;
  }>;
  tempScale: {
    min: number;
    max: number;
  };
  showOutdoorTemp: boolean;
  showFlowTemp: boolean;
}

export default function TemperatureLineLayer({
  bars,
  yScale,
  innerWidth,
  innerHeight,
  chartData,
  tempScale,
  showOutdoorTemp,
  showFlowTemp,
}: TemperatureLineLayerProps) {
  const { t } = useTranslation();

  if (!chartData || chartData.length === 0) return null;

  // Create a separate scale for temperature (right Y-axis)
  const tempYScale = (value: number) => {
    const { min, max } = tempScale;
    const range = max - min;
    const normalizedValue = (value - min) / range;
    // Map to the chart height (inverted because SVG coordinates start at top)
    return yScale.range()[0] - normalizedValue * (yScale.range()[0] - yScale.range()[1]);
  };

  // Get x positions for each data point
  const getXPosition = (index: number) => {
    const bar = bars[index];
    if (!bar) return 0;
    return bar.x + bar.width / 2; // Center of the bar
  };

  // Generate line paths
  const generateLinePath = (tempKey: "outdoor_temp" | "flow_temp") => {
    const points: Array<{ x: number; y: number }> = [];

    chartData.forEach((d, i) => {
      const tempValue = d[tempKey];
      if (typeof tempValue === "number") {
        const x = getXPosition(i);
        const y = tempYScale(tempValue);
        points.push({ x, y });
      }
    });

    if (points.length === 0) return "";

    // Create SVG path
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  const outdoorTempPath = generateLinePath("outdoor_temp");
  const flowTempPath = generateLinePath("flow_temp");

  // Generate temperature axis ticks (around 10 ticks)
  const generateTempTicks = () => {
    const { min, max } = tempScale;
    const range = max - min;
    const targetTickCount = 10;
    const roughStep = range / (targetTickCount - 1);

    // Round step to a nice number (1, 2, 5, 10, etc.)
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const residual = roughStep / magnitude;
    let niceStep: number;

    if (residual <= 1) {
      niceStep = magnitude;
    } else if (residual <= 2) {
      niceStep = 2 * magnitude;
    } else if (residual <= 5) {
      niceStep = 5 * magnitude;
    } else {
      niceStep = 10 * magnitude;
    }

    // Generate ticks
    const ticks: number[] = [];
    const tickMin = Math.ceil(min / niceStep) * niceStep;

    for (let tick = tickMin; tick <= max; tick += niceStep) {
      ticks.push(Math.round(tick));
    }

    return ticks;
  };

  const tempTicks = generateTempTicks();
  const rightAxisX = innerWidth;

  return (
    <g>
      {/* Temperature lines */}
      {showOutdoorTemp && outdoorTempPath && (
        <path
          d={outdoorTempPath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {showFlowTemp && flowTempPath && (
        <path
          d={flowTempPath}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Right Y-axis for temperature */}
      <g transform={`translate(${rightAxisX}, 0)`}>
        {/* Axis line */}
        <line
          x1={0}
          y1={yScale.range()[1]}
          x2={0}
          y2={yScale.range()[0]}
          stroke="#777"
          strokeWidth={1}
        />

        {/* Ticks and labels */}
        {tempTicks.map((temp) => {
          const y = tempYScale(temp);
          return (
            <g key={temp}>
              <line x1={0} y1={y} x2={5} y2={y} stroke="#777" strokeWidth={1} />
              <text
                x={10}
                y={y}
                textAnchor="start"
                dominantBaseline="middle"
                style={{ fontSize: 11, fill: "#333" }}
              >
                {Math.round(temp)}°
              </text>
            </g>
          );
        })}

        {/* Axis label */}
        <text
          x={40}
          y={innerHeight / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(90, 40, ${innerHeight / 2})`}
          style={{ fontSize: 12, fill: "#333", fontWeight: 500 }}
        >
          {t("common.temperature")} (°C)
        </text>
      </g>
    </g>
  );
}
