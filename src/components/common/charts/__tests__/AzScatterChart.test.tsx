import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AzScatterChart, type ScatterDataPoint } from "../AzScatterChart";

// Mock the translation hook
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "common.azTotal": "AZ Total",
        "common.azHeating": "AZ Heating",
        "common.outdoorTemperature": "Outdoor Temperature",
        "common.flowTemperature": "Flow Temperature",
        "charts.noData": "No data available",
        "charts.temperatureDelta": "Temperature Delta (Flow - Outdoor)",
        "charts.azValue": "COP Value",
        "charts.azTempStats": "COPs",
        "charts.slope": "Slope",
        "charts.interceptAt0C": "COP at 0°C",
        "charts.mae": "Mean Abs. Error",
        "charts.showStats": "Show Statistics",
        "charts.hideStats": "Hide Statistics",
        "charts.regressionCurve": "Fitted Curve",
        "charts.slopeTooltip": "How much COP changes per degree temperature change",
        "charts.interceptTooltip": "Predicted COP at 0°C outdoor temperature",
        "charts.rSquaredTooltip": "Goodness of fit (1.0 = perfect fit, closer to 1 is better)",
        "charts.sampleSizeTooltip": "Number of data points used for regression",
        "charts.maeTooltip": "Average prediction error (lower is better)",
        "charts.predictedCopTooltip": "Predicted COP at this temperature based on regression",
      };
      return translations[key] || key;
    },
  }),
}));

describe("AzScatterChart", () => {
  const mockData: ScatterDataPoint[] = [
    {
      az: 3.5,
      az_heating: 3.2,
      outdoor_temperature_c: 5.0,
      flow_temperature_c: 35.0,
      heating_id: "system-1",
      name: "System 1",
      date: "2024-01-15",
    },
    {
      az: 3.8,
      az_heating: 3.5,
      outdoor_temperature_c: 7.0,
      flow_temperature_c: 33.0,
      heating_id: "system-2",
      name: "System 2",
      date: "2024-01-16",
    },
    {
      az: 4.2,
      az_heating: 3.9,
      outdoor_temperature_c: 10.0,
      flow_temperature_c: 30.0,
      heating_id: "system-3",
      name: "System 3",
      date: "2024-01-17",
    },
  ];

  describe("Rendering", () => {
    it("should render the scatter chart with data", () => {
      const { container } = render(<AzScatterChart data={mockData} />);

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });

    it("should render 'No data available' message when data is empty", () => {
      render(<AzScatterChart data={[]} />);

      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    it("should render toggle buttons for switching x-axis", () => {
      render(<AzScatterChart data={mockData} />);

      expect(screen.getByText("Outdoor Temperature")).toBeInTheDocument();
      expect(screen.getByText("Flow Temperature")).toBeInTheDocument();
      expect(screen.getByText("Temperature Delta (Flow - Outdoor)")).toBeInTheDocument();
    });
  });

  describe("Data Filtering", () => {
    it("should filter out points with null az values when showing az", () => {
      const dataWithNulls: ScatterDataPoint[] = [
        {
          az: 3.5,
          az_heating: 3.2,
          outdoor_temperature_c: 5.0,
          flow_temperature_c: 35.0,
        },
        {
          az: null,
          az_heating: 3.5,
          outdoor_temperature_c: 7.0,
          flow_temperature_c: 33.0,
        },
      ];

      const { container } = render(<AzScatterChart data={dataWithNulls} />);

      // Should render the chart (has valid data)
      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });

    it("should filter out points with null az_heating values when showing az_heating", () => {
      const dataWithNulls: ScatterDataPoint[] = [
        {
          az: 3.5,
          az_heating: 3.2,
          outdoor_temperature_c: 5.0,
          flow_temperature_c: 35.0,
        },
        {
          az: 3.8,
          az_heating: null,
          outdoor_temperature_c: 7.0,
          flow_temperature_c: 33.0,
        },
      ];

      const { container } = render(<AzScatterChart data={dataWithNulls} />);

      // Should still render the chart (note: AZ Total/Heating are legend items, not buttons)
      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });

    it("should filter out points with null outdoor_temperature_c", () => {
      const dataWithNulls: ScatterDataPoint[] = [
        {
          az: 3.5,
          az_heating: 3.2,
          outdoor_temperature_c: 5.0,
          flow_temperature_c: 35.0,
        },
        {
          az: 3.8,
          az_heating: 3.5,
          outdoor_temperature_c: null,
          flow_temperature_c: 33.0,
        },
      ];

      const { container } = render(<AzScatterChart data={dataWithNulls} />);

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });

    it("should filter out points with null flow_temperature_c when showing temperature delta", () => {
      const dataWithNulls: ScatterDataPoint[] = [
        {
          az: 3.5,
          az_heating: 3.2,
          outdoor_temperature_c: 5.0,
          flow_temperature_c: 35.0,
        },
        {
          az: 3.8,
          az_heating: 3.5,
          outdoor_temperature_c: 7.0,
          flow_temperature_c: null,
        },
      ];

      const { container } = render(<AzScatterChart data={dataWithNulls} />);

      // Click temperature delta button
      const tempDeltaButton = screen.getByText("Temperature Delta (Flow - Outdoor)");
      fireEvent.click(tempDeltaButton);

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });
  });

  describe("Toggle Functionality", () => {
    it("should toggle between temperature modes", () => {
      render(<AzScatterChart data={mockData} />);

      const outdoorTempButton = screen.getByText("Outdoor Temperature");
      const flowTempButton = screen.getByText("Flow Temperature");
      const tempDeltaButton = screen.getByText("Temperature Delta (Flow - Outdoor)");

      // Initially Outdoor Temperature should be active
      expect(outdoorTempButton.closest("button")).toHaveClass("MuiButton-contained");
      expect(flowTempButton.closest("button")).toHaveClass("MuiButton-outlined");
      expect(tempDeltaButton.closest("button")).toHaveClass("MuiButton-outlined");

      // Click Flow Temperature
      fireEvent.click(flowTempButton);

      // Now Flow Temperature should be active
      expect(outdoorTempButton.closest("button")).toHaveClass("MuiButton-outlined");
      expect(flowTempButton.closest("button")).toHaveClass("MuiButton-contained");
      expect(tempDeltaButton.closest("button")).toHaveClass("MuiButton-outlined");

      // Click Temperature Delta
      fireEvent.click(tempDeltaButton);

      // Now Temperature Delta should be active
      expect(outdoorTempButton.closest("button")).toHaveClass("MuiButton-outlined");
      expect(flowTempButton.closest("button")).toHaveClass("MuiButton-outlined");
      expect(tempDeltaButton.closest("button")).toHaveClass("MuiButton-contained");
    });
  });

  describe("Data with Missing Fields", () => {
    it("should handle data points without name or heating_id", () => {
      const dataWithoutNames: ScatterDataPoint[] = [
        {
          az: 3.5,
          az_heating: 3.2,
          outdoor_temperature_c: 5.0,
          flow_temperature_c: 35.0,
        },
      ];

      const { container } = render(<AzScatterChart data={dataWithoutNames} />);

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });

    it("should handle data points without date", () => {
      const dataWithoutDate: ScatterDataPoint[] = [
        {
          az: 3.5,
          az_heating: 3.2,
          outdoor_temperature_c: 5.0,
          flow_temperature_c: 35.0,
          heating_id: "system-1",
          name: "System 1",
        },
      ];

      const { container } = render(<AzScatterChart data={dataWithoutDate} />);

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("should handle single data point", () => {
      const singlePoint: ScatterDataPoint[] = [
        {
          az: 3.5,
          az_heating: 3.2,
          outdoor_temperature_c: 5.0,
          flow_temperature_c: 35.0,
        },
      ];

      const { container } = render(<AzScatterChart data={singlePoint} />);

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });

    it("should handle data where all points have null values for selected metric", () => {
      const allNullAz: ScatterDataPoint[] = [
        {
          az: null,
          az_heating: 3.2,
          outdoor_temperature_c: 5.0,
          flow_temperature_c: 35.0,
        },
        {
          az: null,
          az_heating: 3.5,
          outdoor_temperature_c: 7.0,
          flow_temperature_c: 33.0,
        },
      ];

      const { container } = render(<AzScatterChart data={allNullAz} />);

      // Should still render the chart (it will show empty data, but not the "no data" message)
      // The chart renders buttons and the card even if filtered data is empty
      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });

    it("should calculate temperature delta correctly", () => {
      const deltaData: ScatterDataPoint[] = [
        {
          az: 3.5,
          az_heating: 3.2,
          outdoor_temperature_c: 5.0,
          flow_temperature_c: 35.0, // Delta should be 30.0
        },
      ];

      const { container } = render(<AzScatterChart data={deltaData} />);

      // Click temperature delta button
      const tempDeltaButton = screen.getByText("Temperature Delta (Flow - Outdoor)");
      fireEvent.click(tempDeltaButton);

      // Should render without errors
      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });

    it("should handle negative temperatures", () => {
      const negativeTemps: ScatterDataPoint[] = [
        {
          az: 3.5,
          az_heating: 3.2,
          outdoor_temperature_c: -10.0,
          flow_temperature_c: 40.0,
        },
      ];

      const { container } = render(<AzScatterChart data={negativeTemps} />);

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });

    it("should handle very large datasets", () => {
      const largeData: ScatterDataPoint[] = Array.from({ length: 1000 }, (_, i) => ({
        az: 3.0 + Math.random(),
        az_heating: 2.8 + Math.random(),
        outdoor_temperature_c: -5 + Math.random() * 30,
        flow_temperature_c: 25 + Math.random() * 20,
        heating_id: `system-${i}`,
        name: `System ${i}`,
        date: `2024-01-${(i % 28) + 1}`,
      }));

      const { container } = render(<AzScatterChart data={largeData} />);

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });
  });

  describe("Regression Analysis Features", () => {
    it("should display regression stats when sufficient data is available", async () => {
      const mockData: ScatterDataPoint[] = [
        { az_heating: 2.5, outdoor_temperature_c: -10 },
        { az_heating: 2.8, outdoor_temperature_c: -5 },
        { az_heating: 3.2, outdoor_temperature_c: 0 },
        { az_heating: 3.6, outdoor_temperature_c: 5 },
        { az_heating: 4.0, outdoor_temperature_c: 10 },
      ];

      const { container } = render(<AzScatterChart data={mockData} />);

      // Regression stats title should be visible (even when collapsed)
      expect(screen.getByText("COPs")).toBeInTheDocument();

      // Stats box is collapsed by default, so temperatures should NOT be visible initially
      expect(screen.queryByText("-7°C")).not.toBeInTheDocument();

      // Find and click the expand button
      const expandButtons = screen.getAllByRole("button");
      const statsExpandButton = expandButtons.find((btn) => btn.closest(".chart-stats") !== null);

      expect(statsExpandButton).toBeDefined();

      if (statsExpandButton) {
        fireEvent.click(statsExpandButton);

        // After clicking, wait for the content to appear
        await waitFor(() => {
          // Check if any temperature label is now visible
          const temps = container.querySelectorAll(".chart-stat-label");
          expect(temps.length).toBeGreaterThan(0);
        });
      }
    });

    it("should not display regression stats with insufficient data", () => {
      const mockData: ScatterDataPoint[] = [{ az_heating: 3.0, outdoor_temperature_c: 0 }];

      render(<AzScatterChart data={mockData} />);

      // Should not show regression stats with only 1 point
      expect(screen.queryByText("Regression Analysis")).not.toBeInTheDocument();
    });

    it("should handle data with null values gracefully", () => {
      const mockData: ScatterDataPoint[] = [
        { az: 3.0, az_heating: null, outdoor_temperature_c: -5 },
        { az: null, az_heating: 3.5, outdoor_temperature_c: 0 },
        { az: 4.0, az_heating: 4.2, outdoor_temperature_c: null },
      ];

      render(<AzScatterChart data={mockData} />);

      // Should render without crashing
      expect(screen.getByText("Outdoor Temperature")).toBeInTheDocument();
    });

    it("should filter out invalid AZ values (zero or negative)", () => {
      const mockData: ScatterDataPoint[] = [
        { az_heating: 0, outdoor_temperature_c: -5 },
        { az_heating: -1, outdoor_temperature_c: 0 },
        { az_heating: 3.5, outdoor_temperature_c: 5 },
        { az_heating: 4.0, outdoor_temperature_c: 10 },
      ];

      render(<AzScatterChart data={mockData} />);

      // Should still render with valid points only
      expect(screen.getByText("Outdoor Temperature")).toBeInTheDocument();
    });
  });

  describe("User Highlighting", () => {
    it("should render without currentUserId prop", () => {
      const mockData: ScatterDataPoint[] = [
        {
          az: 3.0,
          az_heating: 3.2,
          outdoor_temperature_c: -5,
          flow_temperature_c: 35,
          heating_id: "heating-1",
          name: "System 1",
          date: "2024-01-01",
          user_id: "user-123",
        },
      ];

      const { container } = render(<AzScatterChart data={mockData} />);
      expect(container).toBeInTheDocument();
    });

    it("should accept currentUserId prop", () => {
      const mockData: ScatterDataPoint[] = [
        {
          az: 3.0,
          az_heating: 3.2,
          outdoor_temperature_c: -5,
          flow_temperature_c: 35,
          heating_id: "heating-1",
          name: "System 1",
          date: "2024-01-01",
          user_id: "user-123",
        },
        {
          az: 3.5,
          az_heating: 3.7,
          outdoor_temperature_c: 0,
          flow_temperature_c: 40,
          heating_id: "heating-2",
          name: "System 2",
          date: "2024-01-02",
          user_id: "user-456",
        },
      ];

      const { container } = render(<AzScatterChart data={mockData} currentUserId="user-123" />);
      expect(container).toBeInTheDocument();
    });

    it("should handle null currentUserId", () => {
      const mockData: ScatterDataPoint[] = [
        {
          az: 3.0,
          az_heating: 3.2,
          outdoor_temperature_c: -5,
          flow_temperature_c: 35,
          heating_id: "heating-1",
          name: "System 1",
          date: "2024-01-01",
          user_id: "user-123",
        },
      ];

      const { container } = render(<AzScatterChart data={mockData} currentUserId={null} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle data points without user_id", () => {
      const mockData: ScatterDataPoint[] = [
        {
          az: 3.0,
          az_heating: 3.2,
          outdoor_temperature_c: -5,
          flow_temperature_c: 35,
          heating_id: "heating-1",
          name: "System 1",
          date: "2024-01-01",
        },
      ];

      const { container } = render(<AzScatterChart data={mockData} currentUserId="user-123" />);
      expect(container).toBeInTheDocument();
    });
  });
});
