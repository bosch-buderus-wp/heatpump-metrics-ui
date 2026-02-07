import type { GridColDef } from "@mui/x-data-grid";
import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import { createFilterValueResolver } from "../filterValueResolver";

describe("createFilterValueResolver", () => {
  it("uses raw cell value for single-argument valueGetter", () => {
    const createdAt = "2026-02-01T08:15:00Z";
    const columns: GridColDef[] = [
      {
        field: "created_at",
        valueGetter: (value) => dayjs(String(value)).format("HH:mm"),
      },
    ];

    const resolve = createFilterValueResolver<{ created_at: string }>(columns);
    const result = resolve({ created_at: createdAt }, "created_at");

    expect(result).toBe(dayjs(createdAt).format("HH:mm"));
    expect(result).not.toBe("Invalid Date");
  });

  it("uses full arguments for multi-argument valueGetter", () => {
    const columns: GridColDef[] = [
      {
        field: "az",
        valueGetter: (_value, row) => Number(row.thermal) / Number(row.electrical),
      },
    ];

    const resolve = createFilterValueResolver<{ az: number; thermal: number; electrical: number }>(
      columns,
    );
    const result = resolve({ az: 0, thermal: 9, electrical: 3 }, "az");

    expect(result).toBe(3);
  });
});
