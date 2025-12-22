import { useTranslation } from "react-i18next";

interface ChartTooltipProps {
  id: string;
  value: number;
  color: string;
  indexValue: string;
  outdoorTemp?: number | null;
  flowTemp?: number | null;
}

export default function ChartTooltip({
  id,
  value,
  color,
  indexValue,
  outdoorTemp,
  flowTemp,
}: ChartTooltipProps) {
  const { t } = useTranslation();

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-header">{indexValue}</div>

      <div className="chart-tooltip-item">
        <div
          className="chart-tooltip-indicator chart-tooltip-indicator-bar"
          style={{ backgroundColor: color }}
        />
        <span className="chart-tooltip-text">
          {id}: <strong>{value}</strong>
        </span>
      </div>

      {outdoorTemp !== null && outdoorTemp !== undefined && (
        <div className="chart-tooltip-item">
          <div className="chart-tooltip-indicator chart-tooltip-indicator-line chart-tooltip-indicator-outdoor" />
          <span className="chart-tooltip-text">
            {t("common.outdoorTemperature")}: <strong>{outdoorTemp.toFixed(1)}°C</strong>
          </span>
        </div>
      )}

      {flowTemp !== null && flowTemp !== undefined && (
        <div className="chart-tooltip-item">
          <div className="chart-tooltip-indicator chart-tooltip-indicator-line chart-tooltip-indicator-flow" />
          <span className="chart-tooltip-text">
            {t("common.flowTemperature")}: <strong>{flowTemp.toFixed(1)}°C</strong>
          </span>
        </div>
      )}
    </div>
  );
}
