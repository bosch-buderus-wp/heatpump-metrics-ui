import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryBarChart } from "../CategoryBarChart";

vi.mock("@nivo/bar", () => ({
  ResponsiveBar: ({
    data,
    layers,
    tooltip,
  }: {
    data: Array<{ category: string; value: number; sampleSize: number }>;
    layers: Array<unknown>;
    tooltip: (props: {
      indexValue: string;
      value: number;
      data: { category: string; value: number; sampleSize: number };
    }) => React.ReactNode;
  }) => {
    const sampleSizeLayer = layers.find((layer) => typeof layer === "function") as (
      props: unknown,
    ) => React.ReactNode;

    return (
      <div data-testid="bar-chart">
        {sampleSizeLayer({
          bars: [
            {
              key: "KfW 55",
              x: 0,
              y: 0,
              width: 100,
              height: 20,
              data: { data: data[0] },
            },
          ],
        })}
        {tooltip({ indexValue: data[0].category, value: data[0].value, data: data[0] })}
      </div>
    );
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => (key === "charts.noData" ? "No data" : key),
  }),
}));

describe("CategoryBarChart", () => {
  it("shows the configured value unit and sample size", () => {
    render(
      <CategoryBarChart
        data={[{ category: "KfW 55", value: 36, sampleSize: 4 }]}
        valueLabel="Average flow temperature"
        valueUnit="°C"
      />,
    );

    expect(screen.getByText("36.0 °C")).toBeInTheDocument();
    expect(screen.getByText("n = 4")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renders the no-data state", () => {
    render(<CategoryBarChart data={[]} valueLabel="Average flow temperature" valueUnit="°C" />);

    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
