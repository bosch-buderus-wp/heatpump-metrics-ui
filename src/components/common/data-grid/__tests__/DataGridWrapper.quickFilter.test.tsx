import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataGridWrapper } from "../DataGridWrapper";

vi.mock("../../layout/Layout", () => ({
  useSession: () => ({ session: null }),
}));

describe("DataGridWrapper quick filter", () => {
  it("propagates searched rows to chart consumers", async () => {
    const onFilterChange = vi.fn();

    render(
      <div style={{ width: 800, height: 500 }}>
        <DataGridWrapper
          rows={[
            { id: "1", name: "Alpha" },
            { id: "2", name: "Beta" },
          ]}
          columns={[
            { field: "id", headerName: "ID" },
            { field: "name", headerName: "Name", flex: 1 },
          ]}
          getRowId={(row) => row.id}
          onFilterChange={onFilterChange}
        />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "toolbar.search" }));
    fireEvent.change(screen.getByPlaceholderText("toolbar.searchPlaceholder"), {
      target: { value: "Alpha" },
    });

    await waitFor(() => {
      expect(onFilterChange).toHaveBeenLastCalledWith([{ id: "1", name: "Alpha" }]);
    });
  });

  it("propagates changed chart values when row IDs stay the same", async () => {
    const onFilterChange = vi.fn();
    const columns = [
      { field: "id", headerName: "ID" },
      { field: "az", headerName: "COP", type: "number" as const },
    ];
    const getRowId = (row: { id: string }) => row.id;
    const { rerender } = render(
      <div style={{ width: 800, height: 500 }}>
        <DataGridWrapper
          rows={[{ id: "1", az: 3 }]}
          columns={columns}
          getRowId={getRowId}
          onFilterChange={onFilterChange}
        />
      </div>,
    );

    await waitFor(() => {
      expect(onFilterChange).toHaveBeenLastCalledWith([{ id: "1", az: 3 }]);
    });

    rerender(
      <div style={{ width: 800, height: 500 }}>
        <DataGridWrapper
          rows={[{ id: "1", az: 4 }]}
          columns={columns}
          getRowId={getRowId}
          onFilterChange={onFilterChange}
        />
      </div>,
    );

    await waitFor(() => {
      expect(onFilterChange).toHaveBeenLastCalledWith([{ id: "1", az: 4 }]);
    });
  });
});
