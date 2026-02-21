import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AzYearlyEnergyScatterChart,
  type YearlyEnergyScatterDataPoint,
} from "../AzYearlyEnergyScatterChart";

let capturedScatterProps: any;

vi.mock("@nivo/scatterplot", () => ({
  ResponsiveScatterPlot: (props: unknown) => {
    capturedScatterProps = props;
    return <div data-testid="nivo-scatter" />;
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "common.azHeating": "AZ Heating",
        "common.az_short": "AZ",
        "charts.myPrefix": "My ",
        "charts.regressionCurve": "Trendline",
        "charts.noData": "No data available",
        "charts.yearlyHeatingEnergyPerArea": "Yearly heating energy per m²",
        "charts.coverage": "Weighted year share",
        "charts.observedMonths": "Observed calendar months",
        "charts.extrapolatedFromPartialYear": "Extrapolated from partial year",
        "charts.azYearlyEnergyStats": "COPs",
        "charts.showStats": "Show Statistics",
        "charts.hideStats": "Hide Statistics",
        "charts.predictedCopTooltipEnergy": "Predicted COP",
      };
      return translations[key] || key;
    },
  }),
}));

describe("AzYearlyEnergyScatterChart", () => {
  beforeEach(() => {
    capturedScatterProps = undefined;
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-19T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a separate user series for current user points", () => {
    const data: YearlyEnergyScatterDataPoint[] = [
      {
        heating_id: "my-system",
        user_id: "user-1",
        year: 2026,
        month: 1,
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 1200,
        electrical_energy_heating_kwh: 400,
      },
      {
        heating_id: "other-system",
        user_id: "user-2",
        year: 2026,
        month: 1,
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 900,
        electrical_energy_heating_kwh: 300,
      },
    ];

    render(<AzYearlyEnergyScatterChart data={data} currentUserId="user-1" />);

    expect(screen.getByTestId("nivo-scatter")).toBeInTheDocument();

    const series = capturedScatterProps.data as Array<{ id: string; data: unknown[] }>;
    expect(series.map((s) => s.id)).toContain("AZ Heating");
    expect(series.map((s) => s.id)).toContain("My AZ Heating");

    const mySeries = series.find((s) => s.id === "My AZ Heating");
    const baseSeries = series.find((s) => s.id === "AZ Heating");

    expect(mySeries?.data).toHaveLength(1);
    expect(baseSeries?.data).toHaveLength(1);
  });

  it("excludes rows from the current month before generating scatter series", () => {
    const data: YearlyEnergyScatterDataPoint[] = [
      {
        heating_id: "current-month-system",
        user_id: "user-1",
        year: 2026,
        month: 2,
        heated_area_m2: 100,
        thermal_energy_heating_kwh: 500,
        electrical_energy_heating_kwh: 200,
      },
    ];

    render(<AzYearlyEnergyScatterChart data={data} currentUserId="user-1" />);

    expect(screen.getByTestId("nivo-scatter")).toBeInTheDocument();

    const series = capturedScatterProps.data as Array<{ id: string; data: unknown[] }>;
    expect(series).toEqual([]);
  });
});
