import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import { IconButton, Tooltip } from "@mui/material";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ChartFullscreenPanelProps {
  title: string;
  children: ReactNode;
}

export function ChartFullscreenPanel({ title, children }: ChartFullscreenPanelProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className={`chart-panel ${open ? "chart-panel--fullscreen" : ""}`}>
      {open && (
        <button
          type="button"
          className="chart-fullscreen-backdrop"
          onClick={() => setOpen(false)}
          aria-label={t("charts.closeFullscreen")}
        />
      )}

      <div className="chart-panel-surface">
        {open ? (
          <div className="chart-fullscreen-title">
            <span>{title}</span>
            <Tooltip title={t("charts.closeFullscreen")}>
              <IconButton aria-label={t("charts.closeFullscreen")} onClick={() => setOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </div>
        ) : (
          <div className="chart-panel-toolbar">
            <Tooltip title={t("charts.openFullscreen")}>
              <IconButton
                aria-label={t("charts.openFullscreen")}
                size="small"
                onClick={() => setOpen(true)}
              >
                <FullscreenIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        )}

        <div className={open ? "chart-fullscreen-content" : undefined}>{children}</div>
      </div>
    </div>
  );
}
