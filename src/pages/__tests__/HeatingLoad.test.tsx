import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HeatingLoad from "../HeatingLoad";

const fixture = vi.hoisted(() => ({
  userId: null as string | null,
  calls: [] as Array<{ table: string; heatingId?: string; from: number; to: number }>,
  systems: [
    {
      heating_id: "a",
      name: "Alpha",
      user_id: "owner",
      design_outdoor_temp_c: -12,
      heating_load_kw: 8,
    },
    {
      heating_id: "b",
      name: "Beta",
      user_id: "other",
      design_outdoor_temp_c: null,
      heating_load_kw: null,
    },
  ],
}));

vi.mock("../../hooks/useModelFamily", () => ({ useModelFamily: () => ({ family: "test" }) }));
vi.mock("../../components/common/layout/Layout", () => ({
  useSession: () => ({ session: fixture.userId ? { user: { id: fixture.userId } } : null }),
}));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    from: (table: string) => {
      let heatingId: string | undefined;
      const builder = {
        select: () => builder,
        eq: (field: string, value: string) => {
          if (field === "heating_id") heatingId = value;
          return builder;
        },
        lt: () => builder,
        order: () => builder,
        range: (from: number, to: number) => {
          fixture.calls.push({ table, heatingId, from, to });
          if (table === "heating_systems_with_location_view")
            return Promise.resolve({ data: fixture.systems, error: null });
          const all = Array.from({ length: 1001 }, (_, i) => ({
            date: `2025-01-${String((i % 28) + 1).padStart(2, "0")}`,
            outdoor_temperature_c: i % 10,
            thermal_energy_heating_kwh: 50,
          }));
          return Promise.resolve({ data: all.slice(from, to + 1), error: null });
        },
      };
      return builder;
    },
  },
}));
vi.mock("../../components/common/charts/HeatingLoadChart", () => ({
  HeatingLoadChart: ({ systemName, values }: { systemName: string; values: unknown[] }) => (
    <div data-testid="chart">
      {systemName}: {values.length}
    </div>
  ),
}));
vi.mock("../../components/common/data-grid", () => ({
  DataGridWrapper: ({
    rows,
    onSelectRow,
  }: {
    rows: typeof fixture.systems;
    onSelectRow: (row: (typeof fixture.systems)[number]) => void;
  }) => (
    <div>
      {rows.map((row) => (
        <button key={row.heating_id} type="button" onClick={() => onSelectRow(row)}>
          {row.name}
        </button>
      ))}
    </div>
  ),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <HeatingLoad />
    </QueryClientProvider>,
  );
}

describe("HeatingLoad page", () => {
  beforeEach(() => {
    fixture.calls = [];
    fixture.userId = null;
  });

  it("waits for a selection and loads all daily pages only for the selected system", async () => {
    renderPage();
    await screen.findByRole("button", { name: "Beta" });
    expect(fixture.calls.filter((call) => call.table === "daily_values_view")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Beta" }));
    await waitFor(() => expect(screen.getByTestId("chart")).toHaveTextContent("Beta: 1001"));
    expect(fixture.calls.filter((call) => call.table === "daily_values_view")).toEqual([
      { table: "daily_values_view", heatingId: "b", from: 0, to: 999 },
      { table: "daily_values_view", heatingId: "b", from: 1000, to: 1999 },
    ]);
  });

  it("selects the user's own system by default and lets them choose another", async () => {
    fixture.userId = "owner";
    renderPage();
    await waitFor(() => expect(screen.getByTestId("chart")).toHaveTextContent("Alpha: 1001"));
    fireEvent.click(screen.getByRole("button", { name: "Beta" }));
    await waitFor(() => expect(screen.getByTestId("chart")).toHaveTextContent("Beta: 1001"));
  });
});
