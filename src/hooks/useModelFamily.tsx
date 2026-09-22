import { createContext, type ReactNode, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_MODEL_FAMILY, normalizeModelFamily } from "../lib/modelFamilies";

const ModelFamilyContext = createContext({
  family: DEFAULT_MODEL_FAMILY,
  setFamily: (_family: string) => {},
});
export function ModelFamilyProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useSearchParams();
  const family = normalizeModelFamily(params.get("family"));
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
