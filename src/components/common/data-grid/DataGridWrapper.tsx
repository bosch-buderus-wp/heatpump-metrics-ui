import { useEffect } from "react";
import { DataGrid, type GridColDef, useGridApiRef } from "@mui/x-data-grid";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { deDE } from "@mui/x-data-grid/locales";
import { useSession } from "../layout/Layout";
import { DataGridToolbar } from "./DataGridToolbar";
import { useDataGridFilter } from "../../../hooks/useDataGridFilter";

interface DataGridWrapperProps<T = Record<string, unknown>> {
  rows: T[];
  columns: GridColDef[];
  loading?: boolean;
  getRowId: (row: T) => string | number;
  columnVisibilityModel?: Record<string, boolean>;
  onFilterChange?: (filteredData: T[]) => void;
}

export function DataGridWrapper<T = Record<string, unknown>>({
  rows,
  columns,
  loading = false,
  getRowId,
  columnVisibilityModel,
  onFilterChange,
}: DataGridWrapperProps<T>) {
  const { session } = useSession();
  const apiRef = useGridApiRef();

  // Use custom hook to handle DataGrid filtering
  // biome-ignore lint/suspicious/noExplicitAny: MUI type incompatibility between RefObject and MutableRefObject
  const [filteredData, handleFilterModelChange] = useDataGridFilter(apiRef as any, rows);

  // Call onFilterChange callback when filtered data changes
  // Use useEffect to avoid calling setState during render
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filteredData);
    }
  }, [filteredData, onFilterChange]);

  const theme = createTheme(
    {
      palette: {
        primary: { main: "#1976d2" },
      },
    },
    deDE,
  );

  return (
    <div style={{ height: "70vh", width: "100%", minHeight: 400, maxHeight: 800 }}>
      <ThemeProvider theme={theme}>
        <DataGrid
          apiRef={apiRef}
          rowHeight={20}
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={getRowId}
          initialState={{
            columns: {
              columnVisibilityModel: columnVisibilityModel || {},
            },
          }}
          onFilterModelChange={handleFilterModelChange}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          showCellVerticalBorder
          showColumnVerticalBorder
          showToolbar
          slots={{
            // biome-ignore lint/suspicious/noExplicitAny: MUI DataGrid toolbar type doesn't match our custom component
            toolbar: DataGridToolbar as any,
          }}
          slotProps={{
            // biome-ignore lint/suspicious/noExplicitAny: Custom userId prop not in MUI's type definition
            toolbar: { userId: session?.user?.id } as any,
          }}
          sx={{ border: "none" }}
        />
      </ThemeProvider>
    </div>
  );
}
