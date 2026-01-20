import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import SpeedIcon from "@mui/icons-material/Speed";
import { Button, ButtonGroup } from "@mui/material";
import { useTranslation } from "react-i18next";

type MetricMode = "cop" | "energy";

interface MetricModeToggleProps {
  metricMode: MetricMode;
  onChange: (mode: MetricMode) => void;
}

/**
 * Toggle buttons for switching between COP and Energy metric modes.
 * Used across Daily, Monthly, and Yearly pages for consistent UI.
 */
export function MetricModeToggle({ metricMode, onChange }: MetricModeToggleProps) {
  const { t } = useTranslation();

  return (
    <ButtonGroup size="small" variant="outlined">
      <Button
        onClick={() => onChange("cop")}
        variant={metricMode === "cop" ? "contained" : "outlined"}
        startIcon={<SpeedIcon />}
      >
        {t("charts.copMode")}
      </Button>
      <Button
        onClick={() => onChange("energy")}
        variant={metricMode === "energy" ? "contained" : "outlined"}
        startIcon={<ElectricBoltIcon />}
      >
        {t("charts.energyMode")}
      </Button>
    </ButtonGroup>
  );
}
