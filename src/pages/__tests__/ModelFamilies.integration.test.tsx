import type { GridFilterModel } from "@mui/x-data-grid";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App";

const { requests, delayed } = vi.hoisted(() => ({
  delayed: { enabled: false, resolvers: new Map<string, (result: unknown) => void>() },
  requests: [] as { table: string; filters: unknown[][]; args?: Record<string, unknown> }[],
}));
vi.mock("../../lib/supabaseClient", async () => {
  const { modelCatalogFixture } = await import("../../test/modelCatalogFixture");
  return {
    supabase: {
      from: (table: string) => {
        const request = { table, filters: [] as unknown[][] };
        requests.push(request);
        const query = {
          select: () => query,
          eq: (...args: unknown[]) => {
            request.filters.push(args);
            return query;
          },
          in: () => query,
          not: () => query,
          or: () => query,
          order: () => query,
          gte: () => query,
          lte: () => query,
          lt: () => query,
          range: () => query,
          abortSignal: () => query,
          // biome-ignore lint/suspicious/noThenProperty: Supabase query builders are intentionally thenable.
          then: (resolve: (result: unknown) => void) => {
            if (delayed.enabled && table === "heating_systems_with_location_view") {
              delayed.resolvers.set(
                String(request.filters.find(([field]) => field === "model_family_id")?.[1]),
                resolve,
              );
              return;
            }
            resolve({
              error: null,
              count: 0,
              data:
                table === "model_families"
                  ? modelCatalogFixture.families
                  : table === "model_combinations"
                    ? modelCatalogFixture.combinations
                    : [],
            });
          },
        };
        return query;
      },
      rpc: (table: string, args: Record<string, unknown>) => {
        requests.push({ table, args, filters: [] });
        return Promise.resolve({ data: [], error: null });
      },
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    },
  };
});
vi.mock("../../components/common/charts", () => ({
  AzBarChart: () => null,
  HistogramChart: () => null,
  AzScatterChart: () => null,
  AzYearlyEnergyScatterChart: () => null,
  HeatingCurveChart: () => null,
  CategoryBarChart: () => null,
  HeatingSeasonChart: () => null,
  SystemsGeoMap: () => null,
}));
vi.mock("../../components/common/data-grid", () => ({
  DataGridWrapper: ({
    activeFilterModel,
    onFilterModelChange,
    rows = [],
  }: {
    rows?: { name?: string }[];
    activeFilterModel?: GridFilterModel;
    onFilterModelChange?: (model: GridFilterModel) => void;
  }) => (
    <>
      <span data-testid="grid-rows">{rows.map((row) => row.name).join(",")}</span>
      <button
        type="button"
        data-testid="grid-filter"
        onClick={() =>
          onFilterModelChange?.({ items: [{ field: "name", operator: "contains", value: "Test" }] })
        }
      >
        {activeFilterModel?.items.length ?? 0}
      </button>
    </>
  ),
}));
function mount(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}
beforeEach(() => {
  requests.length = 0;
  delayed.enabled = false;
  delayed.resolvers.clear();
  window.HEAT_PUMP_METRICS_EMBEDDED = false;
});
describe("public model families", () => {
  it("does not render late responses or cached rows from another family", async () => {
    delayed.enabled = true;
    const client = mount("/systems");
    await waitFor(() => expect(delayed.resolvers.has("cs5800_6800")).toBe(true));
    await waitFor(() =>
      expect(screen.getByLabelText("Modellfamilie", { selector: "select" })).toBeEnabled(),
    );
    fireEvent.change(screen.getByLabelText("Modellfamilie", { selector: "select" }), {
      target: { value: "cs8800" },
    });
    await waitFor(() => expect(delayed.resolvers.has("cs8800")).toBe(true));
    await act(async () => {
      delayed.resolvers.get("cs5800_6800")?.({
        data: [{ heating_id: "old", name: "Old family" }],
        error: null,
      });
    });
    expect(screen.getByTestId("grid-rows")).not.toHaveTextContent("Old family");
    await act(async () => {
      delayed.resolvers.get("cs8800")?.({
        data: [{ heating_id: "new", name: "New family" }],
        error: null,
      });
    });
    await waitFor(() => expect(screen.getByTestId("grid-rows")).toHaveTextContent("New family"));
    expect(client.getQueryData(["systems-with-location", "cs5800_6800"])).toEqual([
      { heating_id: "old", name: "Old family" },
    ]);
    expect(screen.getByTestId("grid-rows")).not.toHaveTextContent("Old family");
  });
  it.each([
    "/",
    "/systems",
    "/yearly",
    "/monthly",
    "/daily",
    "/building-comparison",
    "/az-energy-evaluation",
    "/az-temp-evaluation",
    "/heating-curve",
  ])("scopes every request and cache key on %s", async (path) => {
    const client = mount(`${path}?family=cs8800`);
    await waitFor(() => expect(client.isFetching()).toBe(0));
    const dataRequests = requests.filter(({ table }) => !table.startsWith("model_"));
    expect(dataRequests.length).toBeGreaterThan(0);
    for (const request of dataRequests) {
      if (request.args) expect(request.args.model_family).toBe("cs8800");
      else
        expect(request.filters).toContainEqual([
          request.table === "measurements" || request.table === "monthly_values"
            ? "heating_systems.model_family_id"
            : "model_family_id",
          "cs8800",
        ]);
    }
    for (const query of client.getQueryCache().getAll()) {
      if (query.queryKey[0] !== "model-catalog") expect(query.queryKey).toContain("cs8800");
    }
    expect(screen.getByLabelText("Modellfamilie", { selector: "select" })).toHaveValue("cs8800");
  });
  it("resets filters and the consumption correction on family changes, and retains the family when navigating", async () => {
    const client = mount("/yearly");
    await waitFor(() => expect(client.isFetching()).toBe(0));
    fireEvent.click(screen.getByTestId("grid-filter"));
    expect(screen.getByTestId("grid-filter")).toHaveTextContent("1");
    const correction = screen.getByRole("switch");
    fireEvent.click(correction);
    expect(correction).toBeChecked();
    fireEvent.change(screen.getByLabelText("Modellfamilie", { selector: "select" }), {
      target: { value: "cs8800" },
    });
    expect(screen.getByTestId("grid-filter")).toHaveTextContent("0");
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Anlagen" }));
    expect(screen.getByLabelText("Modellfamilie", { selector: "select" })).toHaveValue("cs8800");
    fireEvent.change(screen.getByLabelText("Modellfamilie", { selector: "select" }), {
      target: { value: "cs5800_6800" },
    });
    fireEvent.click(screen.getByRole("link", { name: "Jahreswerte" }));
    expect(screen.getByRole("switch")).not.toBeChecked();
  });
  it("shows the selector in embedded mode and defaults invalid links to the standard family", async () => {
    window.HEAT_PUMP_METRICS_EMBEDDED = true;
    const client = mount("/yearly?family=unknown");
    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(screen.getByLabelText("Modellfamilie", { selector: "select" })).toHaveValue(
      "cs5800_6800",
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Alle Familien/ })).not.toBeInTheDocument();
    window.HEAT_PUMP_METRICS_EMBEDDED = false;
  });
});
