import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import type { ReactNode } from "react";

interface CollapsibleChartStatsProps {
  title: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  expandLabel: string;
  collapseLabel: string;
  children: ReactNode;
}

export function CollapsibleChartStats({
  title,
  expanded,
  onToggle,
  expandLabel,
  collapseLabel,
  children,
}: CollapsibleChartStatsProps) {
  return (
    <>
      <div className="chart-stats-header">
        <h3 className="chart-stats-title chart-stats-title-no-margin">{title}</h3>
        <Tooltip title={expanded ? collapseLabel : expandLabel}>
          <IconButton size="small" onClick={onToggle} sx={{ p: 0.5 }}>
            {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        </Tooltip>
      </div>
      {expanded && <div className="chart-stats-expanded">{children}</div>}
    </>
  );
}
