import FullscreenIcon from "@mui/icons-material/Fullscreen";
import { IconButton, Tooltip } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useChartFullscreenPanel } from "./ChartFullscreenPanel";

interface ChartUtilityFrameProps {
  children: ReactNode;
  utility?: ReactNode;
}

export function ChartUtilityFrame({ children, utility }: ChartUtilityFrameProps) {
  const { t } = useTranslation();
  const fullscreenPanel = useChartFullscreenPanel();

  return (
    <div className="chart-with-utility">
      <div className="chart-utility-bar chart-utility-bar-card">
        <div className="chart-stats chart-stats-inline">{utility}</div>
        {!fullscreenPanel?.open && (
          <Tooltip title={t("charts.openFullscreen")}>
            <IconButton
              aria-label={t("charts.openFullscreen")}
              size="small"
              onClick={() => fullscreenPanel?.setOpen(true)}
            >
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </div>
      <div className="chart-container-relative card chart-container-relative-attached">
        {children}
      </div>
    </div>
  );
}
