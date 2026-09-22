import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Systems from "../Systems";

const systems = [
  { heating_id: "system-1", name: "Alpha", country: "DE" },
  { heating_id: "system-2", name: "Beta", country: "AT" },
];

vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ order: () => Promise.resolve({ data: systems, error: null }) }),
      }),
    }),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../../components/common/charts", () => ({
  SystemsGeoMap: ({ systems }: { systems: Array<{ heating_id: string }> }) => (
    <div data-testid="systems-map">{systems.map(({ heating_id }) => heating_id).join(",")}</div>
  ),
}));

vi.mock("../../components/common/data-grid", () => ({
  DataGridWrapper: ({
    onFilterModelChange,
  }: {
    onFilterModelChange: (model: {
      items: Array<{ field: string; operator: string; value: string }>;
    }) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onFilterModelChange({
          items: [{ field: "country", operator: "equals", value: "DE" }],
        })
      }
    >
      Filter Germany
    </button>
  ),
}));

describe("Systems map filtering", () => {
  it("applies the data-grid filter model to the map", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Systems />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("systems-map")).toHaveTextContent("system-1,system-2");
    });

    fireEvent.click(screen.getByText("Filter Germany"));

    expect(screen.getByTestId("systems-map")).toHaveTextContent("system-1");
    expect(screen.getByTestId("systems-map")).not.toHaveTextContent("system-2");
  });
});
