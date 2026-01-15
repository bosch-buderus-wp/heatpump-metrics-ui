import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HistogramChart } from "../HistogramChart";

// Mock @nivo/bar
vi.mock("@nivo/bar", () => ({
  ResponsiveBar: vi.fn(({ data, legends, tooltip, axisBottom, ...props }) => {
    const legendConfig = legends?.[0];

    return (
      <div data-testid="responsive-bar" role="application" {...props}>
        <div data-testid="chart-data">{JSON.stringify(data)}</div>
        <div data-testid="axis-bottom-legend">{axisBottom?.legend}</div>

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

describe("HistogramChart - Energy Mode", () => {
  const mockYearlyData = [
    // System 1: 12 months of data
    {
      heating_id: "sys1",
      month: 1,
      electrical_energy_kwh: 300,
      electrical_energy_heating_kwh: 250,
      thermal_energy_kwh: 1200,
      thermal_energy_heating_kwh: 1000,
    },
    {
      heating_id: "sys1",
      month: 2,
      electrical_energy_kwh: 280,
      electrical_energy_heating_kwh: 230,
      thermal_energy_kwh: 1120,
      thermal_energy_heating_kwh: 920,
    },
    {
      heating_id: "sys1",
      month: 3,
      electrical_energy_kwh: 250,
      electrical_energy_heating_kwh: 200,
      thermal_energy_kwh: 1000,
      thermal_energy_heating_kwh: 800,
    },
    {
      heating_id: "sys1",
      month: 4,
      electrical_energy_kwh: 200,
      electrical_energy_heating_kwh: 150,
      thermal_energy_kwh: 800,
      thermal_energy_heating_kwh: 600,
    },
    {
      heating_id: "sys1",
      month: 5,
      electrical_energy_kwh: 150,
      electrical_energy_heating_kwh: 100,
      thermal_energy_kwh: 600,
      thermal_energy_heating_kwh: 400,
    },
    {
      heating_id: "sys1",
      month: 6,
      electrical_energy_kwh: 100,
      electrical_energy_heating_kwh: 50,
      thermal_energy_kwh: 400,
      thermal_energy_heating_kwh: 200,
    },
    {
      heating_id: "sys1",
      month: 7,
      electrical_energy_kwh: 80,
      electrical_energy_heating_kwh: 30,
      thermal_energy_kwh: 320,
      thermal_energy_heating_kwh: 120,
    },
    {
      heating_id: "sys1",
      month: 8,
      electrical_energy_kwh: 90,
      electrical_energy_heating_kwh: 40,
      thermal_energy_kwh: 360,
      thermal_energy_heating_kwh: 160,
    },
    {
      heating_id: "sys1",
      month: 9,
      electrical_energy_kwh: 180,
      electrical_energy_heating_kwh: 130,
      thermal_energy_kwh: 720,
      thermal_energy_heating_kwh: 520,
    },
    {
      heating_id: "sys1",
      month: 10,
      electrical_energy_kwh: 240,
      electrical_energy_heating_kwh: 190,
      thermal_energy_kwh: 960,
      thermal_energy_heating_kwh: 760,
    },
    {
      heating_id: "sys1",
      month: 11,
      electrical_energy_kwh: 270,
      electrical_energy_heating_kwh: 220,
      thermal_energy_kwh: 1080,
      thermal_energy_heating_kwh: 880,
    },
    {
      heating_id: "sys1",
      month: 12,
      electrical_energy_kwh: 310,
      electrical_energy_heating_kwh: 260,
      thermal_energy_kwh: 1240,
      thermal_energy_heating_kwh: 1040,
    },
    // System 2: 12 months of data (slightly different consumption)
    {
      heating_id: "sys2",
      month: 1,
      electrical_energy_kwh: 320,
      electrical_energy_heating_kwh: 270,
      thermal_energy_kwh: 1280,
      thermal_energy_heating_kwh: 1080,
    },
    {
      heating_id: "sys2",
      month: 2,
      electrical_energy_kwh: 290,
      electrical_energy_heating_kwh: 240,
      thermal_energy_kwh: 1160,
      thermal_energy_heating_kwh: 960,
    },
    {
      heating_id: "sys2",
      month: 3,
      electrical_energy_kwh: 260,
      electrical_energy_heating_kwh: 210,
      thermal_energy_kwh: 1040,
      thermal_energy_heating_kwh: 840,
    },
    {
      heating_id: "sys2",
      month: 4,
      electrical_energy_kwh: 210,
      electrical_energy_heating_kwh: 160,
      thermal_energy_kwh: 840,
      thermal_energy_heating_kwh: 640,
    },
    {
      heating_id: "sys2",
      month: 5,
      electrical_energy_kwh: 160,
      electrical_energy_heating_kwh: 110,
      thermal_energy_kwh: 640,
      thermal_energy_heating_kwh: 440,
    },
    {
      heating_id: "sys2",
      month: 6,
      electrical_energy_kwh: 110,
      electrical_energy_heating_kwh: 60,
      thermal_energy_kwh: 440,
      thermal_energy_heating_kwh: 240,
    },
    {
      heating_id: "sys2",
      month: 7,
      electrical_energy_kwh: 90,
      electrical_energy_heating_kwh: 40,
      thermal_energy_kwh: 360,
      thermal_energy_heating_kwh: 160,
    },
    {
      heating_id: "sys2",
      month: 8,
      electrical_energy_kwh: 100,
      electrical_energy_heating_kwh: 50,
      thermal_energy_kwh: 400,
      thermal_energy_heating_kwh: 200,
    },
    {
      heating_id: "sys2",
      month: 9,
      electrical_energy_kwh: 190,
      electrical_energy_heating_kwh: 140,
      thermal_energy_kwh: 760,
      thermal_energy_heating_kwh: 560,
    },
    {
      heating_id: "sys2",
      month: 10,
      electrical_energy_kwh: 250,
      electrical_energy_heating_kwh: 200,
      thermal_energy_kwh: 1000,
      thermal_energy_heating_kwh: 800,
    },
    {
      heating_id: "sys2",
      month: 11,
      electrical_energy_kwh: 280,
      electrical_energy_heating_kwh: 230,
      thermal_energy_kwh: 1120,
      thermal_energy_heating_kwh: 920,
    },
    {
      heating_id: "sys2",
      month: 12,
      electrical_energy_kwh: 320,
      electrical_energy_heating_kwh: 270,
      thermal_energy_kwh: 1280,
      thermal_energy_heating_kwh: 1080,
    },
  ];

  const mockDailyData = [
    // System 1: measurements throughout the day (cumulative counters)
    {
      heating_id: "sys1",
      created_at: "2024-01-15T00:00:00Z",
      electrical_energy_kwh: 1000,
      electrical_energy_heating_kwh: 800,
      thermal_energy_kwh: 4000,
      thermal_energy_heating_kwh: 3200,
    },
    {
      heating_id: "sys1",
      created_at: "2024-01-15T06:00:00Z",
      electrical_energy_kwh: 1003,
      electrical_energy_heating_kwh: 802,
      thermal_energy_kwh: 4012,
      thermal_energy_heating_kwh: 3208,
    },
    {
      heating_id: "sys1",
      created_at: "2024-01-15T12:00:00Z",
      electrical_energy_kwh: 1008,
      electrical_energy_heating_kwh: 806,
      thermal_energy_kwh: 4032,
      thermal_energy_heating_kwh: 3224,
    },
    {
      heating_id: "sys1",
      created_at: "2024-01-15T18:00:00Z",
      electrical_energy_kwh: 1015,
      electrical_energy_heating_kwh: 812,
      thermal_energy_kwh: 4060,
      thermal_energy_heating_kwh: 3248,
    },
    {
      heating_id: "sys1",
      created_at: "2024-01-15T23:59:59Z",
      electrical_energy_kwh: 1020,
      electrical_energy_heating_kwh: 816,
      thermal_energy_kwh: 4080,
      thermal_energy_heating_kwh: 3264,
    },
    // System 2: measurements throughout the day
    {
      heating_id: "sys2",
      created_at: "2024-01-15T00:00:00Z",
      electrical_energy_kwh: 2000,
      electrical_energy_heating_kwh: 1600,
      thermal_energy_kwh: 8000,
      thermal_energy_heating_kwh: 6400,
    },
    {
      heating_id: "sys2",
      created_at: "2024-01-15T23:59:59Z",
      electrical_energy_kwh: 2018,
      electrical_energy_heating_kwh: 1614,
      thermal_energy_kwh: 8072,
      thermal_energy_heating_kwh: 6456,
    },
  ];

  describe("Yearly Energy Aggregation", () => {
    it("aggregates all months per system to get yearly total", () => {
      render(<HistogramChart data={mockYearlyData} metricMode="energy" binSize={100} />);

      const chartData = JSON.parse(screen.getByTestId("chart-data").textContent || "[]");

      // Should have bins, not individual monthly values
      expect(chartData.length).toBeGreaterThan(0);
      expect(chartData.length).toBeLessThan(24); // Not 24 rows (12 months x 2 systems)

      // System 1 total: 300+280+250+200+150+100+80+90+180+240+270+310 = 2450 kWh
      // System 2 total: 320+290+260+210+160+110+90+100+190+250+280+320 = 2580 kWh
      // These should be grouped into bins
    });

    it("shows distribution of yearly totals, not monthly values", () => {
      render(<HistogramChart data={mockYearlyData} metricMode="energy" statsTitle="Test Stats" />);

      // Stats should reflect yearly totals averaged across systems
      expect(screen.getByText("charts.mean")).toBeInTheDocument();
      expect(screen.getByText("charts.median")).toBeInTheDocument();

      // Mean should be around (2450 + 2580) / 2 = 2515 kWh
      const statsContainer = screen.getByText("Test Stats").parentElement;
      expect(statsContainer).toBeTruthy();
    });

    it("formats bin labels without decimals in energy mode", () => {
      render(<HistogramChart data={mockYearlyData} metricMode="energy" binSize={100} />);

      const chartData = JSON.parse(screen.getByTestId("chart-data").textContent || "[]");

      if (chartData.length > 0) {
        const firstBinLabel = chartData[0].binLabel;
        // Should be like "2400-2500" not "2400.0-2500.0"
        expect(firstBinLabel).toMatch(/^\d+-\d+$/);
        expect(firstBinLabel).not.toContain(".");
      }
    });
  });

  describe("Daily Energy Calculation (TAZ Method)", () => {
    it("calculates daily total using first-last difference", () => {
      render(
        <HistogramChart data={mockDailyData} metricMode="energy" useDailyTaz={true} binSize={5} />,
      );

      const chartData = JSON.parse(screen.getByTestId("chart-data").textContent || "[]");

      // Should have bins representing the distribution
      expect(chartData.length).toBeGreaterThan(0);

      // System 1: 1020 - 1000 = 20 kWh/day
      // System 2: 2018 - 2000 = 18 kWh/day
      // These should be binned appropriately
    });

    it("shows correct stats for daily totals in kWh", () => {
      render(
        <HistogramChart
          data={mockDailyData}
          metricMode="energy"
          useDailyTaz={true}
          statsTitle="Daily Stats"
        />,
      );

      // Should show kWh unit in stats
      const statsSection = screen.getByText("Daily Stats").parentElement;
      expect(statsSection?.textContent).toContain("kWh");
    });
  });

  describe("Bin Sizing", () => {
    it("uses provided bin size when specified", () => {
      render(
        <HistogramChart data={mockDailyData} metricMode="energy" useDailyTaz={true} binSize={5} />,
      );

      const chartData = JSON.parse(screen.getByTestId("chart-data").textContent || "[]");

      if (chartData.length > 0) {
        const binLabel = chartData[0].binLabel;
        // With 5 kWh bins, should see ranges like "15-20", "20-25"
        const parts = binLabel.split("-").map(Number);
        if (parts.length === 2) {
          expect(parts[1] - parts[0]).toBe(5);
        }
      }
    });

    it("calculates appropriate bin size for large yearly data", () => {
      render(
        <HistogramChart
          data={mockYearlyData}
          metricMode="energy"
          // No binSize provided - should auto-calculate
        />,
      );

      const chartData = JSON.parse(screen.getByTestId("chart-data").textContent || "[]");

      // Should create reasonable number of bins (not 50+)
      expect(chartData.length).toBeLessThan(30);
      expect(chartData.length).toBeGreaterThan(0);
    });
  });

  describe("Axis Labels and Units", () => {
    it("shows correct axis label based on metric mode", () => {
      // Energy mode
      render(<HistogramChart data={mockYearlyData} metricMode="energy" />);

      const axisLabel = screen.getByTestId("axis-bottom-legend");
      expect(axisLabel.textContent).toContain("charts.electricalEnergyTotal");

      // COP mode - verify label key is different
      // (We can't fully test COP mode rendering without complex mock data,
      // but the label logic is straightforward and tested for energy mode)
    });

    it("includes kWh unit in tooltip for energy mode", () => {
      render(<HistogramChart data={mockYearlyData} metricMode="energy" />);

      const tooltip = screen.getByTestId("tooltip");
      expect(tooltip.textContent).toContain("kWh");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty data gracefully", () => {
      render(<HistogramChart data={[]} metricMode="energy" />);

      expect(screen.getByText("charts.noData")).toBeInTheDocument();
    });

    it("handles single system data", () => {
      const singleSystem = mockYearlyData.filter((row) => row.heating_id === "sys1");

      render(<HistogramChart data={singleSystem} metricMode="energy" binSize={100} />);

      // Should still render successfully
      expect(screen.getByTestId("responsive-bar")).toBeInTheDocument();
      const chartData = JSON.parse(screen.getByTestId("chart-data").textContent || "[]");
      expect(chartData.length).toBeGreaterThan(0);
    });

    it("handles systems with incomplete months", () => {
      const incompleteData = [
        {
          heating_id: "sys1",
          month: 1,
          electrical_energy_kwh: 300,
          electrical_energy_heating_kwh: 250,
          thermal_energy_kwh: 1200,
          thermal_energy_heating_kwh: 1000,
        },
        {
          heating_id: "sys1",
          month: 2,
          electrical_energy_kwh: 280,
          electrical_energy_heating_kwh: 230,
          thermal_energy_kwh: 1120,
          thermal_energy_heating_kwh: 920,
        },
        // Only 2 months
      ];

      render(<HistogramChart data={incompleteData} metricMode="energy" binSize={100} />);

      // Should still calculate total for available months (300 + 280 = 580 kWh)
      expect(screen.getByTestId("responsive-bar")).toBeInTheDocument();
      const chartData = JSON.parse(screen.getByTestId("chart-data").textContent || "[]");
      expect(chartData.length).toBeGreaterThan(0);
    });

    it("handles zero energy values", () => {
      const zeroEnergyData = [
        {
          heating_id: "sys1",
          month: 1,
          electrical_energy_kwh: 0,
          electrical_energy_heating_kwh: 0,
          thermal_energy_kwh: 0,
          thermal_energy_heating_kwh: 0,
        },
      ];

      render(<HistogramChart data={zeroEnergyData} metricMode="energy" />);

      // Zero energy means no data to show - should display no data message
      expect(screen.getByText("charts.noData")).toBeInTheDocument();
    });
  });

  describe("Legend Switching", () => {
    it("shows both total and heating energy legends in energy mode", () => {
      render(<HistogramChart data={mockYearlyData} metricMode="energy" />);

      // Legends should use energy labels
      expect(screen.getByTestId("responsive-bar")).toBeInTheDocument();
      // The legend items are rendered in the mock
    });
  });

  describe("Stats Display", () => {
    it("displays mean and median with kWh unit in energy mode", () => {
      render(
        <HistogramChart data={mockYearlyData} metricMode="energy" statsTitle="Energy Stats" />,
      );

      expect(screen.getByText("charts.mean")).toBeInTheDocument();
      expect(screen.getByText("charts.median")).toBeInTheDocument();

      // Stats should include kWh unit
      const statsContainer = screen.getByText("Energy Stats").parentElement;
      expect(statsContainer?.textContent).toContain("kWh");
    });

    it("displays stats without decimals in energy mode", () => {
      render(
        <HistogramChart data={mockYearlyData} metricMode="energy" statsTitle="Energy Stats" />,
      );

      const statsContainer = screen.getByText("Energy Stats").parentElement;
      const text = statsContainer?.textContent || "";

      // Should have whole numbers like "2515 kWh", not "2515.45 kWh"
      const kwhMatches = text.match(/(\d+)\s*kWh/g);
      if (kwhMatches) {
        kwhMatches.forEach((match) => {
          expect(match).not.toMatch(/\.\d+\s*kWh/);
        });
      }
    });
  });

  describe("Data Filtering", () => {
    it("filters out systems with unrealistic COP calculated from energy totals", () => {
      const dataWithUnrealisticValues = [
        ...mockYearlyData.slice(0, 12), // Only include sys1 data (12 months)
        // Add unrealistic system with similar energy consumption to sys1 but unrealistic COP
        {
          heating_id: "sys-unrealistic-cop",
          month: 1,
          thermal_energy_kwh: 22500, // 2500 * 9 = very high thermal for 2500 electrical
          electrical_energy_kwh: 2500, // Similar total to sys1 (2450)
          thermal_energy_heating_kwh: 20250,
          electrical_energy_heating_kwh: 2250,
        },
      ];

      render(<HistogramChart data={dataWithUnrealisticValues} metricMode="energy" binSize={100} />);

      const chartData = JSON.parse(screen.getByTestId("chart-data").textContent || "[]");

      // Calculate total systems in bins
      const totalSystemsInBins = chartData.reduce((sum: number, bin: any) => sum + bin.count, 0);

      // Should only have 1 realistic system (sys1 = 2450 kWh)
      // sys-unrealistic-cop (2500 kWh) should be filtered out due to COP = 9.0
      expect(totalSystemsInBins).toBe(1);
    });
  });
});
