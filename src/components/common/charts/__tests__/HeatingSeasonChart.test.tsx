import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HeatingSeasonChart } from "../HeatingSeasonChart";

vi.mock("@mui/material", () => ({
  Tooltip: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-tooltip={title}>{children}</div>
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, values?: { share?: number; count?: number }) => {
      if (key === "charts.noData") return "No data";
      if (key === "buildingComparison.heatingSeasonTitle") return "Heating season";
      if (key === "buildingComparison.heatingSeasonTooltip") {
        return `${values?.share}% of systems heat (n = ${values?.count})`;
      }
      return key;
    },
  }),
}));

const months = Array.from({ length: 12 }, (_, index) => ({
  month: index + 1,
  active: index === 0 || index === 1,
  activeShare: index < 2 ? 0.75 : 0,
  sampleSize: index < 2 ? 4 : 0,
}));

describe("HeatingSeasonChart", () => {
  it("renders the season band and a tooltip for every month", () => {
    const { container } = render(<HeatingSeasonChart data={[{ category: "KfW 55", months }]} />);

    expect(screen.getByText("KfW 55")).toBeInTheDocument();
    expect(container.querySelectorAll(".heating-season-cell--active")).toHaveLength(2);
    expect(container.querySelector("[data-tooltip='75% of systems heat (n = 4)']")).toBeTruthy();
  });

  it("renders a no-data state", () => {
    render(<HeatingSeasonChart data={[]} />);

    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
