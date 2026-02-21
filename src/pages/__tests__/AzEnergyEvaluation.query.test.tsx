import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AzEnergyEvaluation from "../AzEnergyEvaluation";

const mockRows = [
  {
    id: "row-1",
    heating_id: "system-1",
    user_id: "user-123",
    year: 2026,
    month: 1,
    name: "System A",
    heated_area_m2: 120,
    thermal_energy_heating_kwh: 1000,
    electrical_energy_heating_kwh: 300,
  },
];

const notMock = vi.fn();
const orMock = vi.fn();
const orderMock = vi.fn();

vi.mock("../../lib/supabaseClient", () => {
  const queryBuilder = {
    select: vi.fn(() => queryBuilder),
    not: (...args: unknown[]) => {
      notMock(...args);
      return queryBuilder;
    },
    or: (filter: string) => {
      orMock(filter);
      return queryBuilder;
    },
    order: (...args: unknown[]) => {
      orderMock(...args);
      if (orderMock.mock.calls.length >= 2) {
        return { data: mockRows, error: null };
      }
      return queryBuilder;
    },
  };

  return {
    supabase: {
      from: vi.fn(() => queryBuilder),
      auth: {
        getSession: vi.fn(() =>
          Promise.resolve({
            data: { session: { user: { id: "user-123" } } },
          }),
        ),
      },
    },
  };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

vi.mock("../../components/common/charts", () => ({
  AzYearlyEnergyScatterChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="yearly-scatter">Chart with {data.length} points</div>
  ),
}));

vi.mock("../../components/common/data-grid", () => ({
  DataGridWrapper: ({ rows }: { rows: unknown[] }) => (
    <div data-testid="data-grid">DataGrid with {rows.length} rows</div>
  ),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe("AzEnergyEvaluation query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters out current month in query so grid and chart share the same base data", async () => {
    const now = new Date();
    const expectedFilter = `year.lt.${now.getFullYear()},and(year.eq.${now.getFullYear()},month.lt.${now.getMonth() + 1})`;

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AzEnergyEvaluation />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("yearly-scatter")).toBeInTheDocument();
      expect(screen.getByTestId("data-grid")).toBeInTheDocument();
    });

    expect(orMock).toHaveBeenCalledWith(expectedFilter);
  });
});
