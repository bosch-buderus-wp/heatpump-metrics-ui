import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_MODEL_FAMILY, MODEL_FAMILY_IDS, normalizeModelFamily } from "../lib/modelFamilies";

const STORAGE_KEY = "heatpump-metrics.modelFamily";

function readStoredFamily(): string {
  try {
    return normalizeModelFamily(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_MODEL_FAMILY;
  }
}

const ModelFamilyContext = createContext({
  family: DEFAULT_MODEL_FAMILY,
  setFamily: (_family: string) => {},
});
export function ModelFamilyProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useSearchParams();
  const [rememberedFamily, setRememberedFamily] = useState(readStoredFamily);
  const requestedFamily = params.get("family");
  const family = MODEL_FAMILY_IDS.some((id) => id === requestedFamily)
    ? normalizeModelFamily(requestedFamily)
    : rememberedFamily;

  useEffect(() => {
    setRememberedFamily(family);
    try {
      window.localStorage.setItem(STORAGE_KEY, family);
    } catch {
      // Keep navigation working when browser storage is blocked or full.
    }
  }, [family]);

  useEffect(() => {
    if (params.get("family") === family) return;
    const next = new URLSearchParams(params);
    next.set("family", family);
    setParams(next, { replace: true });
  }, [family, params, setParams]);

  function setFamily(value: string) {
    const next = new URLSearchParams(params);
    next.set("family", normalizeModelFamily(value));
    setParams(next);
  }
  return (
    <ModelFamilyContext.Provider value={{ family, setFamily }}>
      {children}
    </ModelFamilyContext.Provider>
  );
}
export function useModelFamily() {
  return useContext(ModelFamilyContext);
}
