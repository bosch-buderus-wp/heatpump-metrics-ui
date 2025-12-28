import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ChartTooltip from "../ChartTooltip";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "common.outdoorTemperature": "Outdoor Temperature",
        "common.flowTemperature": "Flow Temperature",
      };
      return translations[key] || key;
    },
  }),
}));

describe("ChartTooltip", () => {
  it("renders the index value as header", () => {
    render(
      <ChartTooltip
        id="AZ Heating"
        value={3.5}
        color="#23a477"
        indexValue="January"
        outdoorTemp={null}
        flowTemp={null}
      />,
    );

    expect(screen.getByText("January")).toBeInTheDocument();
  });

  it("displays AZ value with color indicator", () => {
    render(
      <ChartTooltip
        id="AZ Heating"
        value={3.5}
        color="#23a477"
        indexValue="January"
        outdoorTemp={null}
        flowTemp={null}
      />,
    );

    expect(screen.getByText(/AZ Heating/i)).toBeInTheDocument();
    expect(screen.getByText("3.5")).toBeInTheDocument();
  });

  it("displays outdoor temperature when provided", () => {
    render(
      <ChartTooltip
        id="AZ Heating"
        value={3.5}
        color="#23a477"
        indexValue="January"
        outdoorTemp={5.2}
        flowTemp={null}
      />,
    );

    expect(screen.getByText(/Outdoor Temperature/i)).toBeInTheDocument();
    expect(screen.getByText(/5.2°C/)).toBeInTheDocument();
  });

  it("displays flow temperature when provided", () => {
    render(
      <ChartTooltip
        id="AZ Heating"
        value={3.5}
        color="#23a477"
        indexValue="January"
        outdoorTemp={null}
        flowTemp={35.0}
      />,
    );

    expect(screen.getByText(/Flow Temperature/i)).toBeInTheDocument();
    expect(screen.getByText(/35.0°C/)).toBeInTheDocument();
  });

  it("displays both temperatures when both are provided", () => {
    render(
      <ChartTooltip
        id="AZ Heating"
        value={3.5}
        color="#23a477"
        indexValue="January"
        outdoorTemp={5.2}
        flowTemp={35.0}
      />,
    );

    expect(screen.getByText(/Outdoor Temperature/i)).toBeInTheDocument();
    expect(screen.getByText(/5.2°C/)).toBeInTheDocument();
    expect(screen.getByText(/Flow Temperature/i)).toBeInTheDocument();
    expect(screen.getByText(/35.0°C/)).toBeInTheDocument();
  });

  it("does not display temperature lines when values are null", () => {
    render(
      <ChartTooltip
        id="AZ Heating"
        value={3.5}
        color="#23a477"
        indexValue="January"
        outdoorTemp={null}
        flowTemp={null}
      />,
    );

    expect(screen.queryByText(/Outdoor Temperature/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Flow Temperature/i)).not.toBeInTheDocument();
  });

  it("does not display temperature lines when values are undefined", () => {
    render(
      <ChartTooltip
        id="AZ Heating"
        value={3.5}
        color="#23a477"
        indexValue="January"
        outdoorTemp={undefined}
        flowTemp={undefined}
      />,
    );

    expect(screen.queryByText(/Outdoor Temperature/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Flow Temperature/i)).not.toBeInTheDocument();
  });

  it("handles zero temperature values correctly", () => {
    render(
      <ChartTooltip
        id="AZ Heating"
        value={3.5}
        color="#23a477"
        indexValue="January"
        outdoorTemp={0}
        flowTemp={0}
      />,
    );

    expect(screen.getByText(/Outdoor Temperature/i)).toBeInTheDocument();
    expect(screen.getAllByText(/0\.0°C/)).toHaveLength(2); // Both temps are 0
    expect(screen.getByText(/Flow Temperature/i)).toBeInTheDocument();
  });

  it("handles negative temperature values correctly", () => {
    render(
      <ChartTooltip
        id="AZ Heating"
        value={3.5}
        color="#23a477"
        indexValue="January"
        outdoorTemp={-5.5}
        flowTemp={30}
      />,
    );

    expect(screen.getByText(/-5.5°C/)).toBeInTheDocument();
    expect(screen.getByText(/30\.0°C/)).toBeInTheDocument();
  });
});
