import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HistogramChart, type HistogramBin } from "../HistogramChart";

// Mock @nivo/bar
vi.mock("@nivo/bar", () => ({
  ResponsiveBar: vi.fn(({ data, legends, tooltip, ...props }) => {
    // Simulate the chart rendering
    const legendConfig = legends?.[0];

    return (
      <div data-testid="responsive-bar" {...props}>
        <div data-testid="chart-data">{JSON.stringify(data)}</div>

        {/* Render legend items */}
        {legendConfig?.data?.map((item: any) => (
          <button
            key={item.id}
            type="button"
            data-testid={`legend-${item.id}`}
            onClick={() => legendConfig.onClick?.(item)}
            style={{ color: item.color }}
          >
            {item.label}
          </button>
        ))}

        {/* Render tooltip for first data point if data exists */}
        {data?.[0] && tooltip && (
          <div data-testid="tooltip">
            {tooltip({
              indexValue: data[0].binLabel,
              value: data[0].count,
              id: "count",
              data: data[0],
            })}
          </div>
        )}
      </div>
    );
  }),
}));

describe("HistogramChart", () => {
  const mockBins: HistogramBin[] = [
    {
      binLabel: "2.0-2.5",
      binStart: 2.0,
      binEnd: 2.5,
      count: 5,
      countHeating: 0,
      systemIds: ["sys1", "sys2", "sys3", "sys4", "sys5"],
    },
    {
      binLabel: "2.5-3.0",
      binStart: 2.5,
      binEnd: 3.0,
      count: 8,
      countHeating: 0,
      systemIds: ["sys6", "sys7", "sys8"],
    },
    {
      binLabel: "3.0-3.5",
      binStart: 3.0,
      binEnd: 3.5,
      count: 3,
      countHeating: 0,
      systemIds: ["sys9"],
    },
  ];

  const mockHeatingBins: HistogramBin[] = [
    {
      binLabel: "2.0-2.5",
      binStart: 2.0,
      binEnd: 2.5,
      count: 0,
      countHeating: 7,
      systemIdsHeating: ["sys1h", "sys2h"],
    },
    {
      binLabel: "2.5-3.0",
      binStart: 2.5,
      binEnd: 3.0,
      count: 0,
      countHeating: 10,
      systemIdsHeating: ["sys3h", "sys4h"],
    },
  ];

  const mockStats = { mean: 2.75, median: 2.6 };
  const mockHeatingStats = { mean: 2.5, median: 2.4 };

  it("renders the histogram chart with data", () => {
    render(
      <HistogramChart
        azBins={mockBins}
        azHeatingBins={mockHeatingBins}
        azStats={mockStats}
        azHeatingStats={mockHeatingStats}
      />,
    );

    expect(screen.getByTestId("responsive-bar")).toBeInTheDocument();
  });

  it("displays 'no data' message when bins are empty", () => {
    render(
      <HistogramChart
        azBins={[]}
        azHeatingBins={[]}
        azStats={{ mean: 0, median: 0 }}
        azHeatingStats={{ mean: 0, median: 0 }}
      />,
    );

    // Translation key is rendered directly in tests
    expect(screen.getByText("charts.noData")).toBeInTheDocument();
  });

  it("renders legend with azTotal and azHeating options", () => {
    render(
      <HistogramChart
        azBins={mockBins}
        azHeatingBins={mockHeatingBins}
        azStats={mockStats}
        azHeatingStats={mockHeatingStats}
      />,
    );

    // Legend items should be rendered
    const legends = screen.getAllByRole("button");
    expect(legends.length).toBeGreaterThanOrEqual(2);
  });

  it("defaults to showing azHeating data", () => {
    render(
      <HistogramChart
        azBins={mockBins}
        azHeatingBins={mockHeatingBins}
        azStats={mockStats}
        azHeatingStats={mockHeatingStats}
      />,
    );

    const chartData = screen.getByTestId("chart-data");
    const dataContent = JSON.parse(chartData.textContent || "[]");

    // Should display heating bins by default
    expect(dataContent).toEqual(mockHeatingBins);
  });

  it("switches to azTotal data when azTotal legend is clicked", () => {
    render(
      <HistogramChart
        azBins={mockBins}
        azHeatingBins={mockHeatingBins}
        azStats={mockStats}
        azHeatingStats={mockHeatingStats}
      />,
    );

    // Click on azTotal legend (first legend item)
    const legends = screen.getAllByRole("button");
    const azTotalLegend = legends[0];

    fireEvent.click(azTotalLegend);

    const chartData = screen.getByTestId("chart-data");
    const dataContent = JSON.parse(chartData.textContent || "[]");

    // Should now display total bins
    expect(dataContent).toEqual(mockBins);
  });

  it("switches back to azHeating data when azHeating legend is clicked", () => {
    render(
      <HistogramChart
        azBins={mockBins}
        azHeatingBins={mockHeatingBins}
        azStats={mockStats}
        azHeatingStats={mockHeatingStats}
      />,
    );

    const legends = screen.getAllByRole("button");
    const azTotalLegend = legends[0];
    const azHeatingLegend = legends[1];

    // First switch to azTotal
    fireEvent.click(azTotalLegend);

    // Then switch back to azHeating
    fireEvent.click(azHeatingLegend);

    const chartData = screen.getByTestId("chart-data");
    const dataContent = JSON.parse(chartData.textContent || "[]");

    // Should display heating bins again
    expect(dataContent).toEqual(mockHeatingBins);
  });

  it("displays mean and median statistics", () => {
    render(
      <HistogramChart
        azBins={mockBins}
        azHeatingBins={mockHeatingBins}
        azStats={mockStats}
        azHeatingStats={mockHeatingStats}
      />,
    );

    // Default is azHeating, so should show heating stats
    expect(screen.getByText(mockHeatingStats.mean.toFixed(2))).toBeInTheDocument();
    expect(screen.getByText(mockHeatingStats.median.toFixed(2))).toBeInTheDocument();
  });

  it("updates statistics when switching between az types", () => {
    render(
      <HistogramChart
        azBins={mockBins}
        azHeatingBins={mockHeatingBins}
        azStats={mockStats}
        azHeatingStats={mockHeatingStats}
      />,
    );

    const legends = screen.getAllByRole("button");
    const azTotalLegend = legends[0];

    // Switch to azTotal
    fireEvent.click(azTotalLegend);

    // Should now show total stats
    expect(screen.getByText(mockStats.mean.toFixed(2))).toBeInTheDocument();
    expect(screen.getByText(mockStats.median.toFixed(2))).toBeInTheDocument();
  });

  it("renders tooltip with correct format", () => {
    render(
      <HistogramChart
        azBins={mockBins}
        azHeatingBins={mockHeatingBins}
        azStats={mockStats}
        azHeatingStats={mockHeatingStats}
      />,
    );

    const tooltip = screen.getByTestId("tooltip");
    expect(tooltip).toBeInTheDocument();

    // Tooltip should show bin label and count
    expect(tooltip.textContent).toContain("2.0-2.5");
  });

  it("has correct accessibility attributes", () => {
    render(
      <HistogramChart
        azBins={mockBins}
        azHeatingBins={mockHeatingBins}
        azStats={mockStats}
        azHeatingStats={mockHeatingStats}
      />,
    );

    const chart = screen.getByTestId("responsive-bar");
    expect(chart).toHaveAttribute("role", "application");
    expect(chart).toHaveAttribute("ariaLabel", "COP Histogram");
  });

  it("handles empty azHeating bins by showing 'no data'", () => {
    render(
      <HistogramChart
        azBins={mockBins}
        azHeatingBins={[]}
        azStats={mockStats}
        azHeatingStats={{ mean: 0, median: 0 }}
      />,
    );

    // Component checks the active dataset (azHeating by default)
    // If that dataset is empty, it shows "no data" message
    expect(screen.getByText("charts.noData")).toBeInTheDocument();
  });

  it("formats statistics to 2 decimal places", () => {
    const preciseStats = { mean: 2.7456789, median: 2.6123456 };

    render(
      <HistogramChart
        azBins={mockBins}
        azHeatingBins={mockHeatingBins}
        azStats={mockStats}
        azHeatingStats={preciseStats}
      />,
    );

    expect(screen.getByText("2.75")).toBeInTheDocument(); // mean
    expect(screen.getByText("2.61")).toBeInTheDocument(); // median
  });

  it("applies correct chart margin settings", () => {
    render(
      <HistogramChart
        azBins={mockBins}
        azHeatingBins={mockHeatingBins}
        azStats={mockStats}
        azHeatingStats={mockHeatingStats}
      />,
    );

    const chart = screen.getByTestId("responsive-bar");
    // Margin is passed as an object prop, check it exists
    expect(chart).toHaveAttribute("margin");
  });

  it("uses correct color for bars", () => {
    render(
      <HistogramChart
        azBins={mockBins}
        azHeatingBins={mockHeatingBins}
        azStats={mockStats}
        azHeatingStats={mockHeatingStats}
      />,
    );

    const chart = screen.getByTestId("responsive-bar");
    expect(chart).toHaveAttribute("colors", "#23a477ff");
  });
});
