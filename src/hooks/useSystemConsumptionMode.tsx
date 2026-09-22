import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { DEFAULT_MODEL_FAMILY } from "../lib/modelFamilies";
import {
  type EnergyDataRow,
  type EnergyPeriod,
  removeSystemConsumptionFromRows,
} from "../lib/systemConsumption";
import { useModelFamily } from "./useModelFamily";

interface SystemConsumptionModeValue {
  excludeSystemConsumption: boolean;
  setExcludeSystemConsumption: (exclude: boolean) => void;
}

const SystemConsumptionModeContext = createContext<SystemConsumptionModeValue>({
  excludeSystemConsumption: false,
  setExcludeSystemConsumption: () => undefined,
});

export function SystemConsumptionModeProvider({ children }: { children: ReactNode }) {
  const [excludeSystemConsumption, setExcludeSystemConsumption] = useState(false);
  const value = useMemo(
    () => ({ excludeSystemConsumption, setExcludeSystemConsumption }),
    [excludeSystemConsumption],
  );

  return (
    <SystemConsumptionModeContext.Provider value={value}>
      {children}
    </SystemConsumptionModeContext.Provider>
  );
}

export function useSystemConsumptionMode() {
  const value = useContext(SystemConsumptionModeContext);
  const { family } = useModelFamily();
  return {
    ...value,
    excludeSystemConsumption: family === DEFAULT_MODEL_FAMILY && value.excludeSystemConsumption,
  };
}

export function useSystemConsumptionRows<T extends EnergyDataRow>(
  rows: T[] | undefined,
  period: EnergyPeriod,
) {
  const { excludeSystemConsumption } = useSystemConsumptionMode();
  return useMemo(
    () => (excludeSystemConsumption ? removeSystemConsumptionFromRows(rows, period) : rows),
    [excludeSystemConsumption, period, rows],
  );
}
