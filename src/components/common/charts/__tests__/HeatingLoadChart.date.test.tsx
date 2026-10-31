import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HeatingLoadChart } from "../HeatingLoadChart";

const locale = vi.hoisted(() => ({ language: "de" }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: locale,
    t: (key: string, values?: { start?: string; end?: string }) =>
      key === "heatingLoad.dataSummary" ? `${values?.start} – ${values?.end}` : key,
  }),
}));

vi.mock("@nivo/scatterplot", () => ({
  ResponsiveScatterPlot: ({
    tooltip: Tooltip,
  }: {
    tooltip: React.ComponentType<{
      node: { serieId: string; data: { x: number; y: number; date: string } };
    }>;
  }) => <Tooltip node={{ serieId: "point", data: { x: 0, y: 2, date: "2026-01-02" } }} />,
}));

const values = [
  { date: "2026-01-02", outdoor_temperature_c: 1, thermal_energy_heating_kwh: 24 },
  { date: "2026-02-03", outdoor_temperature_c: 2, thermal_energy_heating_kwh: 24 },
];

describe("HeatingLoadChart dates", () => {
  it("formats the period and tooltip in the selected language", () => {
    locale.language = "de";
    const { rerender } = render(
      <HeatingLoadChart
        values={values}
        systemName="Haus"
        designTemperature={null}
        declaredLoad={null}
        isLoading={false}
      />,
    );
    expect(screen.getByText("02.01.2026 – 03.02.2026")).toBeInTheDocument();
    expect(screen.getByText("02.01.2026")).toBeInTheDocument();

    locale.language = "en";
    rerender(
      <HeatingLoadChart
        values={values}
        systemName="Haus"
        designTemperature={null}
        declaredLoad={null}
        isLoading={false}
      />,
    );
    expect(screen.getByText("01/02/2026 – 02/03/2026")).toBeInTheDocument();
    expect(screen.getByText("01/02/2026")).toBeInTheDocument();
  });
});
