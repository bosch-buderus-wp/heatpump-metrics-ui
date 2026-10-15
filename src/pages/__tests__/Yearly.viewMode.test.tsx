import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Yearly from "../Yearly";

const fixture = vi.hoisted(() => ({ extraRows: [] as Record<string, unknown>[] }));

vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () =>
            Promise.resolve({
              data: [
                ...Array.from({ length: 12 }, (_, i) => ({
                  id: `complete-${i}`,
                  heating_id: "complete",
                  month: i + 1,
                  year: 2026,
                })),
                { id: "partial", heating_id: "partial", month: 10, year: 2026 },
                ...fixture.extraRows,
              ],
              error: null,
            }),
        }),
      }),
    }),
  },
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("../../hooks/useComparisonMode", () => ({
  useComparisonMode: () => ({ comparisonMode: false, dataGridComparisonProps: {} }),
}));
vi.mock("../../components/common/layout", () => ({
  PageLayout: ({
    chartControls,
    chart,
    children,
  }: {
    chartControls: ReactNode;
    chart: ReactNode;
    children: ReactNode;
  }) => (
    <>
      {chartControls}
      {chart}
      {children}
    </>
  ),
  ChartUtilityFrame: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("../../components/common/charts", () => ({
  AzBarChart: () => null,
  HistogramChart: () => null,
}));
vi.mock("../../components/common/data-grid", () => ({
  DataGridWrapper: ({ rows }: { rows: unknown[] }) => <div data-testid="rows">{rows.length}</div>,
}));

function renderYearly() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <Yearly />
    </QueryClientProvider>,
  );
}

describe("Yearly view switches", () => {
  beforeEach(() => {
    fixture.extraRows = [];
  });

  it("keeps complete systems with negligible summer heating in distribution", async () => {
    fixture.extraRows = Array.from({ length: 12 }, (_, i) => ({
      id: `pumpinator-${i}`,
      heating_id: "pumpinator",
      month: i + 1,
      year: 2025,
      az: 2.5,
      az_heating: i === 6 ? 0.0005747 : 4,
    }));
    renderYearly();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2025" } });
    await waitFor(() => expect(screen.getByTestId("rows")).toHaveTextContent(/^25$/));
    fireEvent.click(screen.getByRole("button", { name: "charts.distribution" }));
    expect(screen.getByRole("checkbox", { name: "charts.completeDataOnly" })).toBeChecked();
    expect(screen.getByTestId("rows")).toHaveTextContent(/^24$/);
  });

  it("requires plausible months for complete distributions while retaining rows for inspection", async () => {
    fixture.extraRows = Array.from({ length: 12 }, (_, i) => ({
      id: `outlier-${i}`,
      heating_id: "outlier",
      month: i + 1,
      year: 2025,
      az: i === 9 ? 0.07 : 4,
    }));
    renderYearly();
    // A past year requires twelve usable months, regardless of today's date.
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2025" } });
    await waitFor(() => expect(screen.getByTestId("rows")).toHaveTextContent(/^25$/));
    fireEvent.click(screen.getByRole("button", { name: "charts.distribution" }));
    expect(screen.getByTestId("rows")).toHaveTextContent(/^12$/);
    fireEvent.click(screen.getByRole("checkbox", { name: "charts.completeDataOnly" }));
    expect(screen.getByTestId("rows")).toHaveTextContent(/^25$/);
    fireEvent.click(screen.getByRole("button", { name: "charts.timeSeries" }));
    expect(screen.getByTestId("rows")).toHaveTextContent(/^25$/);
  });

  it("uses complete systems by default in distribution and all systems in time series", async () => {
    renderYearly();
    await waitFor(() => expect(screen.getByTestId("rows")).toHaveTextContent("13"));
    expect(
      screen.queryByRole("checkbox", { name: "charts.completeDataOnly" }),
    ).not.toBeInTheDocument();
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole("button", { name: "charts.distribution" }));
      expect(screen.getByTestId("rows")).toHaveTextContent("12");
      expect(screen.getByRole("checkbox", { name: "charts.completeDataOnly" })).toBeChecked();
      fireEvent.click(screen.getByRole("button", { name: "charts.timeSeries" }));
      expect(screen.getByTestId("rows")).toHaveTextContent("13");
      expect(
        screen.queryByRole("checkbox", { name: "charts.completeDataOnly" }),
      ).not.toBeInTheDocument();
    }
  });

  it("allows incomplete distribution data explicitly, but restores the default on re-entry", async () => {
    renderYearly();
    await waitFor(() => expect(screen.getByTestId("rows")).toHaveTextContent("13"));
    fireEvent.click(screen.getByRole("button", { name: "charts.distribution" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "charts.completeDataOnly" }));
    expect(screen.getByTestId("rows")).toHaveTextContent("13");
    fireEvent.click(screen.getByRole("button", { name: "charts.distribution" }));
    expect(screen.getByRole("checkbox", { name: "charts.completeDataOnly" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "charts.timeSeries" }));
    expect(screen.getByTestId("rows")).toHaveTextContent("13");
    fireEvent.click(screen.getByRole("button", { name: "charts.distribution" }));
    expect(screen.getByRole("checkbox", { name: "charts.completeDataOnly" })).toBeChecked();
    expect(screen.getByTestId("rows")).toHaveTextContent("12");
  });
});
