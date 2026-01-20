import BarChartIcon from "@mui/icons-material/BarChart";
import TimelineIcon from "@mui/icons-material/Timeline";
import { Button, ButtonGroup } from "@mui/material";
import { useTranslation } from "react-i18next";

type ViewMode = "timeSeries" | "distribution";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

/**
 * Toggle buttons for switching between time series and distribution chart views.
 * Used across Daily, Monthly, and Yearly pages for consistent UI.
 */
export function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  const { t } = useTranslation();

  return (
    <ButtonGroup size="small" variant="outlined">
      <Button
        onClick={() => onChange("timeSeries")}
        variant={viewMode === "timeSeries" ? "contained" : "outlined"}
        startIcon={<TimelineIcon />}
      >
        {t("charts.timeSeries")}
      </Button>
      <Button
        onClick={() => onChange("distribution")}
        variant={viewMode === "distribution" ? "contained" : "outlined"}
        startIcon={<BarChartIcon />}
      >
        {t("charts.distribution")}
      </Button>
    </ButtonGroup>
  );
}
