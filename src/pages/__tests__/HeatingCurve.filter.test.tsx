import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HeatingCurve from "../HeatingCurve";

const { mockRpc } = vi.hoisted(() => {
  const mockedDailyValues = [
    {
      heating_id: "system-1",
      date: "2024-01-01",
      name: "System A",
      postal_code: "12345",
      country: "DE",
      heating_type: "air_water",
      model_idu: "Model1",
      model_odu: "Model2",
      outdoor_temperature_c: -5,
      flow_temperature_c: 35,
      user_id: "user-123",
    },
    {
      heating_id: "system-2",
      date: "2024-01-02",
      name: "System B",
      postal_code: "67890",
      country: "AT",
      heating_type: "ground_water",
      model_idu: "Model3",
      model_odu: "Model4",
      outdoor_temperature_c: 2,
      flow_temperature_c: 32,
      user_id: "user-456",
    },
    {
      heating_id: "system-1",
      date: "2024-01-03",
      name: "System A",
      postal_code: "12345",
      country: "DE",
      heating_type: "air_water",
      model_idu: "Model1",
      model_odu: "Model2",
      outdoor_temperature_c: 5,
      flow_temperature_c: 30,
      user_id: "user-123",
    },
  ];

  return {
    mockRpc: vi.fn(() =>
      Promise.resolve({
        data: mockedDailyValues,
        error: null,
      }),
    ),
  };
});

vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    rpc: mockRpc,
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({
          data: {
            session: {
              user: {
                id: "user-123",
              },
            },
          },
        }),
      ),
    },
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "heatingCurve.title": "Heating Curve",
        "heatingCurve.info": "Analysis of flow temperature vs outdoor temperature",
      };
      return translations[key] || key;
    },
    i18n: {
      language: "en",
    },
  }),
}));

vi.mock("../../components/common/charts", () => ({
  HeatingCurveChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="heating-curve-chart">Chart with {data.length} points</div>
  ),
}));

vi.mock("../../components/common/data-grid", () => ({
  DataGridWrapper: ({
    rows,
    activeFilterModel,
    onFilterModelChange,
  }: {
    rows: unknown[];
    activeFilterModel?: { items?: Array<{ field: string; operator: string; value?: unknown }> };
    onFilterModelChange?: (model: {
      items: Array<{ field: string; operator: string; value?: unknown }>;
    }) => void;
  }) => (
    <div data-testid="data-grid">
      <div>DataGrid with {rows.length} rows</div>
      <div data-testid="active-filter-count">{activeFilterModel?.items?.length ?? 0}</div>
      <button
        type="button"
        onClick={() =>
          onFilterModelChange?.({
            items: [{ field: "outdoor_temperature_c", operator: "<=", value: "5" }],
          })
        }
      >
        Apply Filter
      </button>
    </div>
  ),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe("HeatingCurve Filter Functionality", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    mockRpc.mockClear();
    queryClient = createTestQueryClient();
  });

  it("renders the page with RPC-backed chart data", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HeatingCurve />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Chart with 3 points")).toBeInTheDocument();
    });

    expect(screen.getByText("DataGrid with 3 rows")).toBeInTheDocument();
  });

  it("calls the outdoor-temperature sampling RPC with the active filter model", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HeatingCurve />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledTimes(2);
    });

    expect(mockRpc).toHaveBeenLastCalledWith(
      "sample_daily_values_view_by_outdoor_temperature",
      expect.objectContaining({
        max_rows: 1000,
        outdoor_temperature_bin_width_k: 2,
        current_user_id: "user-123",
        filter_model: { logic: "and", items: [] },
      }),
    );

    fireEvent.click(screen.getByText("Apply Filter"));

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledTimes(3);
    });

    expect(mockRpc).toHaveBeenLastCalledWith(
      "sample_daily_values_view_by_outdoor_temperature",
      expect.objectContaining({
        filter_model: {
          logic: "and",
          items: [{ field: "outdoor_temperature_c", operator: "<=", value: 5 }],
        },
      }),
    );
  });
});
