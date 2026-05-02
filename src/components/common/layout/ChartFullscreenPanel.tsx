import CloseIcon from "@mui/icons-material/Close";
import { IconButton, Tooltip } from "@mui/material";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface ChartFullscreenPanelProps {
  title: string;
  controls?: ReactNode;
  children: ReactNode;
}

interface ChartFullscreenPanelContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ChartFullscreenPanelContext = createContext<ChartFullscreenPanelContextValue | null>(null);

export function useChartFullscreenPanel() {
  return useContext(ChartFullscreenPanelContext);
}

export function ChartFullscreenPanel({ title, controls, children }: ChartFullscreenPanelProps) {
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

  const surface = (
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
      ) : null}

      <div className={open ? "chart-fullscreen-content" : undefined}>
        {controls ? <div className="chart-panel-controls">{controls}</div> : null}
        {children}
      </div>
    </div>
  );

  return (
    <ChartFullscreenPanelContext.Provider value={{ open, setOpen }}>
      {!open ? <div className="chart-panel">{surface}</div> : null}
      {open
        ? createPortal(
            <div className="chart-panel chart-panel--fullscreen">
              <button
                type="button"
                className="chart-fullscreen-backdrop"
                onClick={() => setOpen(false)}
                aria-label={t("charts.closeFullscreen")}
              />
              {surface}
            </div>,
            document.body,
          )
        : null}
    </ChartFullscreenPanelContext.Provider>
  );
}
