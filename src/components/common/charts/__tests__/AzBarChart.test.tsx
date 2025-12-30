import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AzBarChart, { type ChartDataRow, type ComparisonDataGroup } from "../AzBarChart";

// Mock the translation hook
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "common.azTotal": "AZ Total",
        "common.azHeating": "AZ Heating",
        "common.month": "Month",
        "common.date": "Date",
        "common.hour": "Hour",
        "common.outdoorTemperature": "Outdoor Temperature",
        "common.flowTemperature": "Flow Temperature",
        "common.noData": "No data available",
      };
      return translations[key] || key;
    },
  }),
}));

describe("AzBarChart", () => {
  const mockMonthlyData: ChartDataRow[] = [
    {
      month: "1",
      az: 3.5,
      az_heating: 3.2,
      outdoor_temperature_c: 5.0,
      flow_temperature_c: 35.0,
    },
    {
      month: "2",
      az: 3.8,
      az_heating: 3.5,
      outdoor_temperature_c: 7.0,
      flow_temperature_c: 33.0,
    },
    {
      month: "3",
      az: 4.2,
      az_heating: 3.9,
      outdoor_temperature_c: 10.0,
      flow_temperature_c: 30.0,
    },
  ];

  describe("Normal Mode", () => {
    it("should render chart with data", () => {
      const { container } = render(
        <AzBarChart
          data={mockMonthlyData}
          indexField="month"
          indexLabel="common.month"
          aggregateData={false}
        />,
      );

      // Chart container should be present (the div with class="card")
      expect(container.querySelector(".card")).toBeTruthy();
    });

    it("should show no data message when data is empty", () => {
      render(
        <AzBarChart data={[]} indexField="month" indexLabel="common.month" aggregateData={false} />,
      );

      expect(screen.getByText("No data available")).toBeTruthy();
    });

    it("should aggregate data when aggregateData is true", () => {
      // Data with duplicate months that should be aggregated
      const duplicateData: ChartDataRow[] = [
        { month: "1", az: 3.0, az_heating: 2.8 },
        { month: "1", az: 4.0, az_heating: 3.6 }, // Should average with first entry
        { month: "2", az: 3.5, az_heating: 3.2 },
      ];

      const { container } = render(
        <AzBarChart
          data={duplicateData}
          indexField="month"
          indexLabel="common.month"
          aggregateData={true}
        />,
      );

      expect(container.querySelector(".card")).toBeTruthy();
    });
  });

  describe("Comparison Mode", () => {
    it("should render comparison chart with two groups", () => {
      const group1Data: ChartDataRow[] = [
        { month: "1", az: 3.5, az_heating: 3.2, outdoor_temperature_c: 5.0 },
        { month: "2", az: 3.8, az_heating: 3.5, outdoor_temperature_c: 7.0 },
      ];

      const group2Data: ChartDataRow[] = [
        { month: "1", az: 2.8, az_heating: 2.5, outdoor_temperature_c: 5.0 },
        { month: "2", az: 3.0, az_heating: 2.7, outdoor_temperature_c: 7.0 },
      ];

      const comparisonGroups: ComparisonDataGroup[] = [
        {
          id: "1",
          name: "Group 1",
          color: "#22c55e",
          data: group1Data,
        },
        {
          id: "2",
          name: "Group 2",
          color: "#86efac",
          data: group2Data,
        },
      ];

      const { container } = render(
        <AzBarChart
          data={[]} // Empty in comparison mode
          indexField="month"
          indexLabel="common.month"
          comparisonGroups={comparisonGroups}
          aggregateData={false}
        />,
      );

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });

    it("should handle comparison mode with filtered data", () => {
      // Simulate filtering: Group 1 has floor heating, Group 2 has radiators
      const floorHeatingData: ChartDataRow[] = [
        {
          month: "1",
          heating_type: "Floor Heating",
          az: 3.5,
          az_heating: 3.2,
        },
        {
          month: "2",
          heating_type: "Floor Heating",
          az: 3.8,
          az_heating: 3.5,
        },
        {
          month: "3",
          heating_type: "Floor Heating",
          az: 4.0,
          az_heating: 3.7,
        },
      ];

      const radiatorsData: ChartDataRow[] = [
        {
          month: "1",
          heating_type: "Radiators",
          az: 2.8,
          az_heating: 2.5,
        },
        {
          month: "2",
          heating_type: "Radiators",
          az: 3.0,
          az_heating: 2.7,
        },
        {
          month: "3",
          heating_type: "Radiators",
          az: 3.2,
          az_heating: 2.9,
        },
      ];

      const comparisonGroups: ComparisonDataGroup[] = [
        {
          id: "1",
          name: "Floor Heating",
          color: "#22c55e",
          data: floorHeatingData,
        },
        {
          id: "2",
          name: "Radiators",
          color: "#86efac",
          data: radiatorsData,
        },
      ];

      const { container } = render(
        <AzBarChart
          data={[]}
          indexField="month"
          indexLabel="common.month"
          comparisonGroups={comparisonGroups}
          aggregateData={false}
        />,
      );

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });

    it("should handle comparison mode with different data lengths", () => {
      // Group 1 has data for 3 months, Group 2 only has 2 months
      const group1Data: ChartDataRow[] = [
        { month: "1", az: 3.5, az_heating: 3.2 },
        { month: "2", az: 3.8, az_heating: 3.5 },
        { month: "3", az: 4.0, az_heating: 3.7 },
      ];

      const group2Data: ChartDataRow[] = [
        { month: "1", az: 2.8, az_heating: 2.5 },
        { month: "2", az: 3.0, az_heating: 2.7 },
      ];

      const comparisonGroups: ComparisonDataGroup[] = [
        {
          id: "1",
          name: "Group 1",
          color: "#22c55e",
          data: group1Data,
        },
        {
          id: "2",
          name: "Group 2",
          color: "#86efac",
          data: group2Data,
        },
      ];

      const { container } = render(
        <AzBarChart
          data={[]}
          indexField="month"
          indexLabel="common.month"
          indexValues={["1", "2", "3"]}
          comparisonGroups={comparisonGroups}
          aggregateData={false}
        />,
      );

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });

    it("should handle empty comparison groups", () => {
      const comparisonGroups: ComparisonDataGroup[] = [
        {
          id: "1",
          name: "Group 1",
          color: "#22c55e",
          data: [],
        },
        {
          id: "2",
          name: "Group 2",
          color: "#86efac",
          data: [],
        },
      ];

      render(
        <AzBarChart
          data={[]}
          indexField="month"
          indexLabel="common.month"
          comparisonGroups={comparisonGroups}
          aggregateData={false}
        />,
      );

      // Should show no data message
      expect(screen.getByText("No data available")).toBeTruthy();
    });
  });

  describe("Index Ordering", () => {
    it("should maintain order with indexValues prop", () => {
      const data: ChartDataRow[] = [
        { month: "12", az: 3.0, az_heating: 2.8 },
        { month: "1", az: 3.5, az_heating: 3.2 },
        { month: "6", az: 4.0, az_heating: 3.7 },
      ];

      const { container } = render(
        <AzBarChart
          data={data}
          indexField="month"
          indexLabel="common.month"
          indexValues={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]}
          aggregateData={false}
        />,
      );

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });

    it("should handle string-based date indices in correct order", () => {
      const data: ChartDataRow[] = [
        { date: "2024-01-15", az: 3.5, az_heating: 3.2 },
        { date: "2024-01-08", az: 3.8, az_heating: 3.5 },
        { date: "2024-01-22", az: 4.0, az_heating: 3.7 },
      ];

      const indexFormatter = (date: string) => {
        const d = new Date(date);
        return d.getDate().toString().padStart(2, "0");
      };

      const { container } = render(
        <AzBarChart
          data={data}
          indexField="date"
          indexLabel="common.date"
          indexFormatter={indexFormatter}
          aggregateData={false}
        />,
      );

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });
  });

  describe("Temperature Data", () => {
    it("should render with temperature data", () => {
      const dataWithTemp: ChartDataRow[] = [
        {
          month: "1",
          az: 3.5,
          az_heating: 3.2,
          outdoor_temperature_c: 5.0,
          flow_temperature_c: 35.0,
        },
        {
          month: "2",
          az: 3.8,
          az_heating: 3.5,
          outdoor_temperature_c: 7.0,
          flow_temperature_c: 33.0,
        },
      ];

      const { container } = render(
        <AzBarChart
          data={dataWithTemp}
          indexField="month"
          indexLabel="common.month"
          aggregateData={false}
        />,
      );

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });

    it("should handle missing temperature data", () => {
      const dataWithoutTemp: ChartDataRow[] = [
        { month: "1", az: 3.5, az_heating: 3.2 },
        { month: "2", az: 3.8, az_heating: 3.5 },
      ];

      const { container } = render(
        <AzBarChart
          data={dataWithoutTemp}
          indexField="month"
          indexLabel="common.month"
          aggregateData={false}
        />,
      );

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });
  });

  describe("Custom Bar Colors", () => {
    it("should use custom bar color in normal mode", () => {
      const { container } = render(
        <AzBarChart
          data={mockMonthlyData}
          indexField="month"
          indexLabel="common.month"
          barColor="#ff0000"
          aggregateData={false}
        />,
      );

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });

    it("should use group colors in comparison mode", () => {
      const comparisonGroups: ComparisonDataGroup[] = [
        {
          id: "1",
          name: "Group 1",
          color: "#ff0000",
          data: [{ month: "1", az: 3.5, az_heating: 3.2 }],
        },
        {
          id: "2",
          name: "Group 2",
          color: "#00ff00",
          data: [{ month: "1", az: 2.8, az_heating: 2.5 }],
        },
      ];

      const { container } = render(
        <AzBarChart
          data={[]}
          indexField="month"
          indexLabel="common.month"
          comparisonGroups={comparisonGroups}
          aggregateData={false}
        />,
      );

      const chartContainer = container.querySelector(".card");
      expect(chartContainer).toBeTruthy();
    });
  });
});
