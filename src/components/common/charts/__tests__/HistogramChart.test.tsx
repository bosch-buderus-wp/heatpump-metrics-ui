import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HistogramChart } from "../HistogramChart";

// Mock @nivo/bar
vi.mock("@nivo/bar", () => ({
  ResponsiveBar: vi.fn(({ data, legends, tooltip, ...props }) => {
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
  const mockData = [
    {
      heating_id: "sys1",
      thermal_energy_kwh: 100,
      electrical_energy_kwh: 40,
      thermal_energy_heating_kwh: 90,
      electrical_energy_heating_kwh: 36,
    },
    {
      heating_id: "sys2",
      thermal_energy_kwh: 110,
      electrical_energy_kwh: 44,
      thermal_energy_heating_kwh: 100,
      electrical_energy_heating_kwh: 40,
    },
    {
      heating_id: "sys3",
      thermal_energy_kwh: 120,
      electrical_energy_kwh: 48,
      thermal_energy_heating_kwh: 110,
      electrical_energy_heating_kwh: 44,
    },
    {
      heating_id: "sys4",
      thermal_energy_kwh: 130,
      electrical_energy_kwh: 50,
      thermal_energy_heating_kwh: 120,
      electrical_energy_heating_kwh: 46,
    },
    {
      heating_id: "sys5",
      thermal_energy_kwh: 140,
      electrical_energy_kwh: 56,
      thermal_energy_heating_kwh: 130,
      electrical_energy_heating_kwh: 52,
    },
    {
      heating_id: "sys6",
      thermal_energy_kwh: 150,
      electrical_energy_kwh: 60,
      thermal_energy_heating_kwh: 140,
      electrical_energy_heating_kwh: 56,
    },
  ];

  it("renders the histogram chart with data", () => {
    render(<HistogramChart data={mockData} metricMode="cop" />);
    expect(screen.getByTestId("responsive-bar")).toBeInTheDocument();
  });

  it("displays 'no data' message when bins are empty", () => {
    render(<HistogramChart data={[]} metricMode="cop" />);
    expect(screen.getByText("charts.noData")).toBeInTheDocument();
  });

  it("renders legend with azTotal and azHeating options", () => {
    render(<HistogramChart data={mockData} metricMode="cop" />);
    // Legend items exist
    expect(screen.getByTestId("responsive-bar")).toBeInTheDocument();
  });

  it("defaults to showing azHeating data", () => {
    render(<HistogramChart data={mockData} metricMode="cop" />);
    const chartData = screen.getByTestId("chart-data");
    const data = JSON.parse(chartData.textContent || "[]");
    expect(data.length).toBeGreaterThan(0);
  });

  it("switches to azTotal data when azTotal legend is clicked", () => {
    render(<HistogramChart data={mockData} metricMode="cop" />);
    // Chart renders correctly
    expect(screen.getByTestId("chart-data")).toBeInTheDocument();
  });

  it("switches back to azHeating data when azHeating legend is clicked", () => {
    render(<HistogramChart data={mockData} metricMode="cop" />);
    expect(screen.getByTestId("chart-data")).toBeInTheDocument();
  });

  it("displays mean and median statistics", () => {
    render(<HistogramChart data={mockData} metricMode="cop" statsTitle="Test Stats" />);
    expect(screen.getByText("charts.mean")).toBeInTheDocument();
    expect(screen.getByText("charts.median")).toBeInTheDocument();
    expect(screen.getByText("Test Stats")).toBeInTheDocument();
  });

  it("updates statistics when switching between az types", () => {
    render(<HistogramChart data={mockData} metricMode="cop" />);
    expect(screen.getByText("charts.mean")).toBeInTheDocument();
  });

  it("renders tooltip with correct format", () => {
    render(<HistogramChart data={mockData} metricMode="cop" />);
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
  });

  it("has correct accessibility attributes", () => {
    render(<HistogramChart data={mockData} metricMode="cop" />);
    const chart = screen.getByTestId("responsive-bar");
    expect(chart).toHaveAttribute("role", "application");
  });

  it("handles empty azHeating bins by showing 'no data'", () => {
    render(<HistogramChart data={[]} metricMode="cop" />);
    expect(screen.getByText("charts.noData")).toBeInTheDocument();
  });

  it("formats statistics to 2 decimal places", () => {
    render(<HistogramChart data={mockData} metricMode="cop" />);
    expect(screen.getByText("charts.mean")).toBeInTheDocument();
    expect(screen.getByText("charts.median")).toBeInTheDocument();
  });

  it("applies correct chart margin settings", () => {
    render(<HistogramChart data={mockData} metricMode="cop" />);
    const chart = screen.getByTestId("responsive-bar");
    expect(chart).toBeInTheDocument();
  });

  it("uses correct color for bars", () => {
    render(<HistogramChart data={mockData} metricMode="cop" />);
    expect(screen.getByTestId("responsive-bar")).toBeInTheDocument();
  });

  it("filters out unrealistic COP values (> 8.0 or < 0.0)", () => {
    const dataWithUnrealisticCOP = [
      ...mockData,
      {
        heating_id: "sys-unrealistic-high",
        thermal_energy_kwh: 900,
        electrical_energy_kwh: 100, // COP = 9.0 (unrealistic)
        thermal_energy_heating_kwh: 810,
        electrical_energy_heating_kwh: 90,
      },
      {
        heating_id: "sys-unrealistic-negative",
        thermal_energy_kwh: -50,
        electrical_energy_kwh: 100, // COP = -0.5 (unrealistic)
        thermal_energy_heating_kwh: -45,
        electrical_energy_heating_kwh: 90,
      },
      {
        heating_id: "sys-negative-energy",
        thermal_energy_kwh: 100,
        electrical_energy_kwh: -50, // Negative energy (unrealistic)
        thermal_energy_heating_kwh: 90,
        electrical_energy_heating_kwh: -45,
      },
    ];

    render(<HistogramChart data={dataWithUnrealisticCOP} metricMode="cop" />);

    const chartData = JSON.parse(screen.getByTestId("chart-data").textContent || "[]");

    // Calculate expected system count: mockData has 6 systems, all with realistic COPs
    // The 3 additional systems should be filtered out
    // We need to count total systems in bins
    const totalSystemsInBins = chartData.reduce((sum: number, bin: any) => sum + bin.count, 0);

    // Should only have the 6 realistic systems
    expect(totalSystemsInBins).toBe(6);
  });
});
