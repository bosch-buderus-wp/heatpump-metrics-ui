import type { GridRenderCellParams } from "@mui/x-data-grid";
import { render, screen } from "@testing-library/react";
import type { TFunction } from "i18next";
import { describe, expect, it, vi } from "vitest";
import { getAllDataGridColumns } from "../../../../lib/tableHelpers";
import AzBarChart from "../AzBarChart";
import { HistogramChart } from "../HistogramChart";

vi.mock("@nivo/bar", () => ({
  ResponsiveBar: ({ data }: { data: unknown[] }) => (
    <div data-testid="chart-data">{JSON.stringify(data)}</div>
  ),
}));

const valid = {
  heating_id: "normal",
  month: 10,
  az: 4.1,
  az_heating: 4.1,
  thermal_energy_kwh: 410,
  electrical_energy_kwh: 100,
  thermal_energy_heating_kwh: 328,
  electrical_energy_heating_kwh: 80,
};
const outlier = {
  ...valid,
  heating_id: "bosch",
  az: 0.07,
  thermal_energy_kwh: 106.68,
  electrical_energy_kwh: 1524,
};

describe("monthly outliers in tables and charts", () => {
  it("keeps a warning with the exclusion reason in the table", () => {
    const t = ((_key: string, params?: { cop: string; min: number }) =>
      params ? `AZ ${params.cop} < ${params.min}: excluded` : _key) as TFunction;
    const cell = getAllDataGridColumns(t).dataQuality.renderCell?.({
      row: outlier,
    } as GridRenderCellParams);
    render(cell);
    expect(screen.getByText("⚠️")).toHaveAttribute("title", "AZ 0.1 < 1: excluded");
  });

  for (const metricMode of ["cop", "energy"] as const) {
    it(`excludes bad months before system aggregation in the ${metricMode} histogram`, () => {
      // A valid month for the same system remains usable.
      render(
        <HistogramChart
          metricMode={metricMode}
          data={[valid, { ...valid, heating_id: "bosch", month: 9 }, outlier]}
        />,
      );
      const bins = JSON.parse(screen.getByTestId("chart-data").textContent || "[]") as {
        count: number;
        binStart: number;
        binEnd: number;
      }[];
      expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(2);
      const expected = metricMode === "cop" ? 4.1 : 80;
      expect(
        bins
          .filter((bin) => bin.count > 0)
          .every((bin) => bin.binStart <= expected && bin.binEnd >= expected),
      ).toBe(true);
    });

    it(`excludes the spike from monthly ${metricMode} averages`, () => {
      render(
        <AzBarChart
          metricMode={metricMode}
          data={[valid, outlier]}
          indexField="month"
          indexLabel="common.month"
        />,
      );
      const chart = screen.getByTestId("chart-data").textContent || "";
      expect(chart).not.toContain("1524");
      expect(chart).toContain(metricMode === "cop" ? ":4.1" : ":100");
    });
  }
});
