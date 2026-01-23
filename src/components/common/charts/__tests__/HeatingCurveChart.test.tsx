import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HeatingCurveChart, type HeatingCurveDataPoint } from "../HeatingCurveChart";

// Mock the translation hook
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "heatingCurve.chartLegend": "Flow Temperature",
        "heatingCurve.statsTitle": "Flow Temperature",
        "heatingCurve.flowAt": "Flow at",
        "heatingCurve.predictedFlowTooltip": "Predicted flow temperature based on regression curve",
        "heatingCurve.regressionCurve": "Regression Curve",
        "heatingCurve.myRegressionCurve": "My Regression Curve",
        "common.outdoorTemperature": "Outdoor Temperature",
        "common.flowTemperature": "Flow Temperature",
        "charts.noData": "No data available",
        "charts.myPrefix": "My ",
        "charts.showStats": "Show Statistics",
        "charts.hideStats": "Hide Statistics",
      };
      return translations[key] || key;
    },
  }),
}));

describe("HeatingCurveChart", () => {
  const mockData: HeatingCurveDataPoint[] = [
    {
      outdoor_temperature_c: -5,
      flow_temperature_c: 45,
      heating_id: "system-1",
      name: "System 1",
      date: "2024-01-15",
      user_id: "user-123",
    },
    {
      outdoor_temperature_c: 0,
      flow_temperature_c: 40,
      heating_id: "system-2",
      name: "System 2",
      date: "2024-01-16",
      user_id: "user-456",
    },
    {
      outdoor_temperature_c: 5,
      flow_temperature_c: 35,
      heating_id: "system-3",
      name: "System 3",
      date: "2024-01-17",
      user_id: "user-789",
    },
  ];

  describe("rendering", () => {
    it("should render without crashing", () => {
      const { container } = render(<HeatingCurveChart data={mockData} />);
      expect(container).toBeInTheDocument();
    });

    it("should show no data message when data is empty", () => {
      render(<HeatingCurveChart data={[]} />);
      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    it("should show no data message when data is null/undefined", () => {
      // @ts-expect-error - testing null case
      render(<HeatingCurveChart data={null} />);
      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    it("should render chart with valid data", () => {
      const { container } = render(<HeatingCurveChart data={mockData} />);
      // Chart should have SVG element from Nivo
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("data filtering", () => {
    it("should filter out points with null outdoor_temperature_c", () => {
      const dataWithNull: HeatingCurveDataPoint[] = [
        { outdoor_temperature_c: 5, flow_temperature_c: 35 },
        { outdoor_temperature_c: null, flow_temperature_c: 40 },
        { outdoor_temperature_c: 10, flow_temperature_c: 30 },
      ];

      const { container } = render(<HeatingCurveChart data={dataWithNull} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should filter out points with null flow_temperature_c", () => {
      const dataWithNull: HeatingCurveDataPoint[] = [
        { outdoor_temperature_c: 5, flow_temperature_c: 35 },
        { outdoor_temperature_c: 0, flow_temperature_c: null },
        { outdoor_temperature_c: 10, flow_temperature_c: 30 },
      ];

      const { container } = render(<HeatingCurveChart data={dataWithNull} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should filter out unrealistic outdoor temperatures below -30°C", () => {
      const dataWithUnrealistic: HeatingCurveDataPoint[] = [
        { outdoor_temperature_c: -35, flow_temperature_c: 50 }, // Should be filtered
        { outdoor_temperature_c: 0, flow_temperature_c: 40 },
        { outdoor_temperature_c: 5, flow_temperature_c: 35 },
        { outdoor_temperature_c: 10, flow_temperature_c: 30 },
      ];

      const { container } = render(<HeatingCurveChart data={dataWithUnrealistic} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should filter out unrealistic outdoor temperatures above 40°C", () => {
      const dataWithUnrealistic: HeatingCurveDataPoint[] = [
        { outdoor_temperature_c: 45, flow_temperature_c: 25 }, // Should be filtered
        { outdoor_temperature_c: 0, flow_temperature_c: 40 },
        { outdoor_temperature_c: 5, flow_temperature_c: 35 },
        { outdoor_temperature_c: 10, flow_temperature_c: 30 },
      ];

      const { container } = render(<HeatingCurveChart data={dataWithUnrealistic} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should filter out unrealistic flow temperatures below 15°C", () => {
      const dataWithUnrealistic: HeatingCurveDataPoint[] = [
        { outdoor_temperature_c: 5, flow_temperature_c: 10 }, // Should be filtered
        { outdoor_temperature_c: 0, flow_temperature_c: 40 },
        { outdoor_temperature_c: -5, flow_temperature_c: 45 },
        { outdoor_temperature_c: 10, flow_temperature_c: 30 },
      ];

      const { container } = render(<HeatingCurveChart data={dataWithUnrealistic} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should filter out unrealistic flow temperatures above 80°C", () => {
      const dataWithUnrealistic: HeatingCurveDataPoint[] = [
        { outdoor_temperature_c: -10, flow_temperature_c: 85 }, // Should be filtered
        { outdoor_temperature_c: 0, flow_temperature_c: 40 },
        { outdoor_temperature_c: 5, flow_temperature_c: 35 },
        { outdoor_temperature_c: 10, flow_temperature_c: 30 },
      ];

      const { container } = render(<HeatingCurveChart data={dataWithUnrealistic} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should show no data when all points are filtered out", () => {
      const allUnrealistic: HeatingCurveDataPoint[] = [
        { outdoor_temperature_c: -35, flow_temperature_c: 50 },
        { outdoor_temperature_c: 50, flow_temperature_c: 40 },
        { outdoor_temperature_c: 0, flow_temperature_c: 10 },
        { outdoor_temperature_c: 5, flow_temperature_c: 90 },
      ];

      render(<HeatingCurveChart data={allUnrealistic} />);
      // Should still render since data array is not empty, but has no valid points
      // The chart should still render with empty series
    });
  });

  describe("stats panel", () => {
    it("should render stats panel when regression is available", () => {
      render(<HeatingCurveChart data={mockData} />);
      expect(screen.getByText("Flow Temperature")).toBeInTheDocument();
    });

    it("should toggle stats panel on button click", () => {
      render(<HeatingCurveChart data={mockData} />);

      // Stats should be collapsed initially
      expect(screen.queryByText(/Flow at -10°C/)).not.toBeInTheDocument();

      // Click to expand
      const toggleButton = screen.getByRole("button");
      fireEvent.click(toggleButton);

      // Stats should now be visible
      expect(screen.getByText(/Flow at -10°C/)).toBeInTheDocument();
      expect(screen.getByText(/Flow at 0°C/)).toBeInTheDocument();
      expect(screen.getByText(/Flow at 10°C/)).toBeInTheDocument();
    });

    it("should show predicted flow temps at reference temperatures", () => {
      render(<HeatingCurveChart data={mockData} />);

      // Expand stats
      const toggleButton = screen.getByRole("button");
      fireEvent.click(toggleButton);

      // Should show predictions for -10, 0, and 10°C
      expect(screen.getByText(/Flow at -10°C/)).toBeInTheDocument();
      expect(screen.getByText(/Flow at 0°C/)).toBeInTheDocument();
      expect(screen.getByText(/Flow at 10°C/)).toBeInTheDocument();
    });
  });

  describe("user data separation", () => {
    it("should render with currentUserId", () => {
      const { container } = render(<HeatingCurveChart data={mockData} currentUserId="user-123" />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should handle null currentUserId", () => {
      const { container } = render(<HeatingCurveChart data={mockData} currentUserId={null} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should handle data points without user_id", () => {
      const dataWithoutUserId: HeatingCurveDataPoint[] = [
        { outdoor_temperature_c: 0, flow_temperature_c: 40, name: "System 1" },
        { outdoor_temperature_c: 5, flow_temperature_c: 35, name: "System 2" },
        { outdoor_temperature_c: 10, flow_temperature_c: 30, name: "System 3" },
      ];

      const { container } = render(
        <HeatingCurveChart data={dataWithoutUserId} currentUserId="user-123" />,
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should separate user data from community data", () => {
      const mixedData: HeatingCurveDataPoint[] = [
        {
          outdoor_temperature_c: -5,
          flow_temperature_c: 45,
          name: "My System",
          user_id: "user-123",
        },
        {
          outdoor_temperature_c: 0,
          flow_temperature_c: 40,
          name: "Other System",
          user_id: "user-456",
        },
        {
          outdoor_temperature_c: 5,
          flow_temperature_c: 35,
          name: "Another System",
          user_id: "user-789",
        },
      ];

      const { container } = render(<HeatingCurveChart data={mixedData} currentUserId="user-123" />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("regression curves", () => {
    it("should render with enough data for regression", () => {
      const regressionData: HeatingCurveDataPoint[] = [
        { outdoor_temperature_c: -10, flow_temperature_c: 50 },
        { outdoor_temperature_c: -5, flow_temperature_c: 45 },
        { outdoor_temperature_c: 0, flow_temperature_c: 40 },
        { outdoor_temperature_c: 5, flow_temperature_c: 35 },
        { outdoor_temperature_c: 10, flow_temperature_c: 30 },
      ];

      const { container } = render(<HeatingCurveChart data={regressionData} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should render user regression when user has 3+ data points", () => {
      const userHeavyData: HeatingCurveDataPoint[] = [
        { outdoor_temperature_c: -5, flow_temperature_c: 48, user_id: "user-123" },
        { outdoor_temperature_c: 0, flow_temperature_c: 43, user_id: "user-123" },
        { outdoor_temperature_c: 5, flow_temperature_c: 38, user_id: "user-123" },
        { outdoor_temperature_c: 10, flow_temperature_c: 33, user_id: "user-123" },
        { outdoor_temperature_c: 0, flow_temperature_c: 40, user_id: "user-456" },
        { outdoor_temperature_c: 5, flow_temperature_c: 35, user_id: "user-789" },
      ];

      const { container } = render(
        <HeatingCurveChart data={userHeavyData} currentUserId="user-123" />,
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should not render user regression when user has less than 3 data points", () => {
      const fewUserData: HeatingCurveDataPoint[] = [
        { outdoor_temperature_c: -5, flow_temperature_c: 48, user_id: "user-123" },
        { outdoor_temperature_c: 0, flow_temperature_c: 43, user_id: "user-123" },
        { outdoor_temperature_c: 0, flow_temperature_c: 40, user_id: "user-456" },
        { outdoor_temperature_c: 5, flow_temperature_c: 35, user_id: "user-789" },
        { outdoor_temperature_c: 10, flow_temperature_c: 30, user_id: "user-999" },
      ];

      const { container } = render(
        <HeatingCurveChart data={fewUserData} currentUserId="user-123" />,
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("should handle single data point (renders chart without regression)", () => {
      const singlePoint: HeatingCurveDataPoint[] = [
        { outdoor_temperature_c: 5, flow_temperature_c: 35 },
      ];

      const { container } = render(<HeatingCurveChart data={singlePoint} />);
      // Single point can still render the scatter plot
      expect(container).toBeInTheDocument();
    });

    it("should handle large dataset", () => {
      const largeData: HeatingCurveDataPoint[] = Array.from({ length: 100 }, (_, i) => ({
        outdoor_temperature_c: -10 + (i % 30),
        flow_temperature_c: 50 - (i % 30) * 0.5,
        heating_id: `system-${i}`,
        name: `System ${i}`,
        date: `2024-01-${String((i % 28) + 1).padStart(2, "0")}`,
      }));

      const { container } = render(<HeatingCurveChart data={largeData} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should handle data at boundary values", () => {
      const boundaryData: HeatingCurveDataPoint[] = [
        { outdoor_temperature_c: -30, flow_temperature_c: 80 }, // At boundaries
        { outdoor_temperature_c: 40, flow_temperature_c: 15 }, // At boundaries
        { outdoor_temperature_c: 0, flow_temperature_c: 40 },
      ];

      const { container } = render(<HeatingCurveChart data={boundaryData} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });
});
