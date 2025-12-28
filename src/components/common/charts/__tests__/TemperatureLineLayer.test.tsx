import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TemperatureLineLayer from "../TemperatureLineLayer";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "common.temperature": "Temperature",
      };
      return translations[key] || key;
    },
  }),
}));

describe("TemperatureLineLayer", () => {
  const mockBars = [
    { x: 50, width: 40 },
    { x: 150, width: 40 },
    { x: 250, width: 40 },
  ];

  const mockYScale = {
    range: () => [300, 0], // SVG coordinates: bottom to top
  };

  const defaultProps = {
    bars: mockBars,
    xScale: {},
    yScale: mockYScale,
    innerWidth: 400,
    innerHeight: 300,
    chartData: [],
    tempScale: { min: 0, max: 40 },
    showOutdoorTemp: true,
    showFlowTemp: true,
  };

  it("renders nothing when chartData is empty", () => {
    const { container } = render(
      <svg role="img" aria-label="test chart">
        <TemperatureLineLayer {...defaultProps} chartData={[]} />
      </svg>,
    );

    expect(container.querySelector("path")).toBeNull();
  });

  it("renders outdoor temperature line when showOutdoorTemp is true", () => {
    const chartData = [
      { month: 1, outdoor_temp: 10 },
      { month: 2, outdoor_temp: 15 },
      { month: 3, outdoor_temp: 20 },
    ];

    const { container } = render(
      <svg role="img" aria-label="test chart">
        <TemperatureLineLayer {...defaultProps} chartData={chartData} />
      </svg>,
    );

    const outdoorLine = container.querySelector('path[stroke="#3b82f6"]');
    expect(outdoorLine).not.toBeNull();
    expect(outdoorLine?.getAttribute("stroke-width")).toBe("2");
  });

  it("renders flow temperature line when showFlowTemp is true", () => {
    const chartData = [
      { month: 1, flow_temp: 30 },
      { month: 2, flow_temp: 35 },
      { month: 3, flow_temp: 40 },
    ];

    const { container } = render(
      <svg role="img" aria-label="test chart">
        <TemperatureLineLayer {...defaultProps} chartData={chartData} />
      </svg>,
    );

    const flowLine = container.querySelector('path[stroke="#ef4444"]');
    expect(flowLine).not.toBeNull();
    expect(flowLine?.getAttribute("stroke-width")).toBe("2");
  });

  it("does not render outdoor temperature line when showOutdoorTemp is false", () => {
    const chartData = [
      { month: 1, outdoor_temp: 10 },
      { month: 2, outdoor_temp: 15 },
    ];

    const { container } = render(
      <svg role="img" aria-label="test chart">
        <TemperatureLineLayer {...defaultProps} chartData={chartData} showOutdoorTemp={false} />
      </svg>,
    );

    const outdoorLine = container.querySelector('path[stroke="#3b82f6"]');
    expect(outdoorLine).toBeNull();
  });

  it("does not render flow temperature line when showFlowTemp is false", () => {
    const chartData = [
      { month: 1, flow_temp: 30 },
      { month: 2, flow_temp: 35 },
    ];

    const { container } = render(
      <svg role="img" aria-label="test chart">
        <TemperatureLineLayer {...defaultProps} chartData={chartData} showFlowTemp={false} />
      </svg>,
    );

    const flowLine = container.querySelector('path[stroke="#ef4444"]');
    expect(flowLine).toBeNull();
  });

  it("skips null temperature values in line generation", () => {
    const chartData = [
      { month: 1, outdoor_temp: 10 },
      { month: 2, outdoor_temp: null },
      { month: 3, outdoor_temp: 20 },
    ];

    const { container } = render(
      <svg role="img" aria-label="test chart">
        <TemperatureLineLayer {...defaultProps} chartData={chartData} />
      </svg>,
    );

    const outdoorLine = container.querySelector('path[stroke="#3b82f6"]');
    expect(outdoorLine).not.toBeNull();
    // Line should have 2 points (skipping null), not 3
    const pathData = outdoorLine?.getAttribute("d") || "";
    const moveToCommands = (pathData.match(/M/g) || []).length;
    expect(moveToCommands).toBe(1); // One path with 2 points
  });

  it("renders right Y-axis with tick marks", () => {
    const chartData = [{ month: 1, outdoor_temp: 10, flow_temp: 30 }];

    const { container } = render(
      <svg role="img" aria-label="test chart">
        <TemperatureLineLayer {...defaultProps} chartData={chartData} />
      </svg>,
    );

    // Check for axis line
    const axisLines = container.querySelectorAll('line[stroke="#777"]');
    expect(axisLines.length).toBeGreaterThan(0);

    // Check for tick labels (text elements)
    const tickLabels = container.querySelectorAll("text");
    expect(tickLabels.length).toBeGreaterThan(0);
  });

  it("renders axis label", () => {
    const chartData = [{ month: 1, outdoor_temp: 10 }];

    const { container } = render(
      <svg role="img" aria-label="test chart">
        <TemperatureLineLayer {...defaultProps} chartData={chartData} />
      </svg>,
    );

    // Find the axis label text
    const texts = Array.from(container.querySelectorAll("text"));
    const axisLabel = texts.find((t) => t.textContent?.includes("Temperature"));
    expect(axisLabel).toBeDefined();
    expect(axisLabel?.textContent).toContain("Temperature (°C)");
  });

  it("generates appropriate number of ticks for different temperature ranges", () => {
    const chartData = [
      { month: 1, outdoor_temp: 0 },
      { month: 2, outdoor_temp: 100 },
    ];

    const { container } = render(
      <svg role="img" aria-label="test chart">
        <TemperatureLineLayer
          {...defaultProps}
          chartData={chartData}
          tempScale={{ min: 0, max: 100 }}
        />
      </svg>,
    );

    // Check that there are tick marks
    const tickLines = Array.from(container.querySelectorAll('line[stroke="#777"]'));
    const shortTicks = tickLines.filter((line) => {
      const x2 = line.getAttribute("x2");
      return x2 === "5"; // Tick marks have x2=5
    });

    // Should have multiple ticks (around 10)
    expect(shortTicks.length).toBeGreaterThan(5);
    expect(shortTicks.length).toBeLessThan(15);
  });

  it("handles small temperature ranges", () => {
    const chartData = [
      { month: 1, outdoor_temp: 18 },
      { month: 2, outdoor_temp: 22 },
    ];

    const { container } = render(
      <svg role="img" aria-label="test chart">
        <TemperatureLineLayer
          {...defaultProps}
          chartData={chartData}
          tempScale={{ min: 18, max: 22 }}
        />
      </svg>,
    );

    const outdoorLine = container.querySelector('path[stroke="#3b82f6"]');
    expect(outdoorLine).not.toBeNull();
  });

  it("handles negative temperatures", () => {
    const chartData = [
      { month: 1, outdoor_temp: -10 },
      { month: 2, outdoor_temp: 5 },
      { month: 3, outdoor_temp: 15 },
    ];

    const { container } = render(
      <svg role="img" aria-label="test chart">
        <TemperatureLineLayer
          {...defaultProps}
          chartData={chartData}
          tempScale={{ min: -10, max: 15 }}
        />
      </svg>,
    );

    const outdoorLine = container.querySelector('path[stroke="#3b82f6"]');
    expect(outdoorLine).not.toBeNull();

    // Check that tick labels include negative values
    const texts = Array.from(container.querySelectorAll("text"));
    const hasNegativeLabel = texts.some((t) => t.textContent?.includes("-"));
    expect(hasNegativeLabel).toBe(true);
  });
});
