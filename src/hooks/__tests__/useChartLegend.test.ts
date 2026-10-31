import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CHART_COLORS } from "../../lib/chartTheme";
import { useChartLegend } from "../useChartLegend";

const copLabels = {
  azTotalKey: "Arbeitszahl (gesamt)",
  azHeatingKey: "Arbeitszahl (Heizung)",
  outdoorTempLabel: "Außentemperatur",
  flowTempLabel: "Vorlauftemperatur",
};
const energyLabels = {
  ...copLabels,
  azTotalKey: "Stromverbrauch (gesamt)",
  azHeatingKey: "Stromverbrauch (Heizung)",
};

describe("chart legend selection", () => {
  it.each(["total", "heating"] as const)(
    "preserves %s selection when switching metrics and languages",
    (selection) => {
      const { result, rerender } = renderHook((props) => useChartLegend(props), {
        initialProps: copLabels,
      });
      const key = selection === "total" ? "azTotalKey" : "azHeatingKey";
      act(() => result.current.handleLegendClick({ id: copLabels[key] }));

      for (const labels of [
        energyLabels,
        {
          ...energyLabels,
          azTotalKey: "Electricity (total)",
          azHeatingKey: "Electricity (heating)",
        },
        copLabels,
      ]) {
        rerender(labels);
        expect(result.current.activeKey).toBe(labels[key]);
        expect(result.current.chartKeys).toEqual([labels[key]]);
        expect(
          result.current.legendItems
            .slice(0, 2)
            .filter((item) => item.color !== CHART_COLORS.inactive)
            .map((item) => item.id),
        ).toEqual([labels[key]]);
      }
    },
  );

  it("defaults to heating and ignores unknown series clicks", () => {
    const { result } = renderHook(() => useChartLegend(copLabels));
    act(() => result.current.handleLegendClick({ id: "regression" }));
    expect(result.current.activeKey).toBe(copLabels.azHeatingKey);
  });

  it("keeps temperature visibility independent of metric selection", () => {
    const { result, rerender } = renderHook((props) => useChartLegend(props), {
      initialProps: copLabels,
    });
    act(() => {
      result.current.handleLegendClick({ id: "outdoor_temp" });
      result.current.handleLegendClick({ id: "flow_temp" });
      result.current.handleLegendClick({ id: copLabels.azTotalKey });
    });
    rerender(energyLabels);
    expect(result.current.activeKey).toBe(energyLabels.azTotalKey);
    expect(result.current.showOutdoorTemp).toBe(false);
    expect(result.current.showFlowTemp).toBe(false);
  });

  it("respects restricted clickable items", () => {
    const { result } = renderHook(() =>
      useChartLegend({ ...copLabels, clickableIds: [copLabels.azTotalKey] }),
    );
    act(() => {
      result.current.handleLegendClick({ id: copLabels.azTotalKey });
      result.current.handleLegendClick({ id: copLabels.azHeatingKey });
      result.current.handleLegendClick({ id: "outdoor_temp" });
    });
    expect(result.current.activeKey).toBe(copLabels.azTotalKey);
    expect(result.current.showOutdoorTemp).toBe(true);
  });
});
