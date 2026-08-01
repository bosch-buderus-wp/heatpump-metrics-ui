import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HeatingSeasonChart } from "../HeatingSeasonChart";

vi.mock("@mui/material", () => ({
  Tooltip: ({ children, title }: { children: React.ReactNode; title: React.ReactNode }) => (
    <div>
      <div data-testid="tooltip">{title}</div>
      {children}
    </div>
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, values?: { start?: string; end?: string; share?: number; count?: number }) => {
      if (key === "charts.noData") return "No data";
      if (key === "buildingComparison.heatingSeasonTitle") return "Heating season";
      if (key === "buildingComparison.heatingSeasonTooltipDate") {
        return `${values?.start} to ${values?.end}`;
      }
      if (key === "buildingComparison.heatingSeasonTooltipDetails") {
        return `${values?.share}% of systems heat (n = ${values?.count})`;
      }
      return key;
    },
  }),
}));

const weeks = Array.from({ length: 53 }, (_, index) => ({
  startDate: `2026-01-${String(index + 1).padStart(2, "0")}`,
  endDate: `2026-01-${String(index + 7).padStart(2, "0")}`,
  month: index < 5 ? 1 : 2,
  active: index === 0 || index === 1,
  activeShare: index < 2 ? 0.75 : 0,
  sampleSize: index < 2 ? 4 : 0,
}));

describe("HeatingSeasonChart", () => {
  it("renders weekly cells under month labels", () => {
    const { container } = render(<HeatingSeasonChart data={[{ category: "KfW 55", weeks }]} />);

    expect(screen.getByText("KfW 55")).toBeInTheDocument();
    expect(container.querySelectorAll(".heating-season-cell")).toHaveLength(53);
    expect(container.querySelectorAll(".heating-season-cell--active")).toHaveLength(2);
    expect(screen.getAllByText("75% of systems heat (n = 4)")).not.toHaveLength(0);
  });

  it("renders a no-data state", () => {
    render(<HeatingSeasonChart data={[]} />);

    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
