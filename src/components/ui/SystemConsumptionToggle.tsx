import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import { FormControlLabel, Switch, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useModelFamily } from "../../hooks/useModelFamily";
import { useSystemConsumptionMode } from "../../hooks/useSystemConsumptionMode";
import { DEFAULT_MODEL_FAMILY } from "../../lib/modelFamilies";

export function SystemConsumptionToggle() {
  const { t } = useTranslation();
  const { excludeSystemConsumption, setExcludeSystemConsumption } = useSystemConsumptionMode();

  const { family } = useModelFamily();
  if (family !== DEFAULT_MODEL_FAMILY) return null;
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
