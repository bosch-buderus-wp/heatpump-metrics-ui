import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import { FormControlLabel, Switch, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSystemConsumptionMode } from "../../hooks/useSystemConsumptionMode";

export function SystemConsumptionToggle() {
  const { t } = useTranslation();
  const { excludeSystemConsumption, setExcludeSystemConsumption } = useSystemConsumptionMode();

  return (
    <Tooltip title={t("charts.systemConsumptionHint")}>
      <FormControlLabel
        className="system-consumption-toggle"
        control={
          <Switch
            size="small"
            checked={excludeSystemConsumption}
            onChange={(event) => setExcludeSystemConsumption(event.target.checked)}
          />
        }
        label={
          <span>
            <BoltOutlinedIcon fontSize="inherit" aria-hidden="true" />
            {t("charts.excludeSystemConsumption")}
          </span>
        }
      />
    </Tooltip>
  );
}
