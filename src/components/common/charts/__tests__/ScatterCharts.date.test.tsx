import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AzScatterChart } from "../AzScatterChart";
import { HeatingCurveChart } from "../HeatingCurveChart";

const locale = vi.hoisted(() => ({ language: "de" }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: locale, t: (key: string) => key }),
}));

vi.mock("@nivo/scatterplot", () => ({
  ResponsiveScatterPlot: ({
    data,
    tooltip: Tooltip,
  }: {
    data: Array<{ data: Array<{ x: number; y: number; date?: string }> }>;
    tooltip: React.ComponentType<{ node: { data: { x: number; y: number; date?: string } } }>;
  }) => {
    const point = data.flatMap((series) => series.data).find((item) => item.date);
    return point ? <Tooltip node={{ data: point }} /> : null;
  },
}));

const data = [
  {
    date: "2026-01-02",
    outdoor_temperature_c: 3,
    flow_temperature_c: 35,
    az: 4,
    az_heating: 4,
    name: "Haus",
  },
];

describe.each([
  ["AZ-Temperatur", AzScatterChart],
  ["Heizkurve", HeatingCurveChart],
])("%s tooltip", (_name, Chart) => {
  it("formats dates in the selected language", () => {
    locale.language = "de";
    const { rerender } = render(<Chart data={data} />);
    expect(screen.getByText("02.01.2026")).toBeInTheDocument();

    locale.language = "en";
    rerender(<Chart data={data} />);
    expect(screen.getByText("01/02/2026")).toBeInTheDocument();
  });
});
