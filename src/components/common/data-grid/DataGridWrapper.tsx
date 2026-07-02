import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid, type GridColDef, type GridFilterModel, useGridApiRef } from "@mui/x-data-grid";
import { deDE } from "@mui/x-data-grid/locales";
import { useEffect, useMemo } from "react";
import { useDataGridFilter } from "../../../hooks/useDataGridFilter";
import { applyGridFilterModel, countActiveFilterItems } from "../../../lib/filterModelUtils";
import { createFilterValueResolver } from "../../../lib/filterValueResolver";
import { useSession } from "../layout/Layout";
import { DataGridToolbar } from "./DataGridToolbar";

interface DataGridWrapperProps<T = Record<string, unknown>> {
  rows: T[];
  columns: GridColDef[];
  loading?: boolean;
  getRowId: (row: T) => string | number;
  columnVisibilityModel?: Record<string, boolean>;
  onFilterChange?: (filteredData: T[]) => void;
  // Comparison mode props
  comparisonMode?: boolean;
  activeGroup?: 1 | 2;
  activeFilterModel?: GridFilterModel;
  filterGroup1Count?: number;
  filterGroup2Count?: number;
  onFilterModelChange?: (model: GridFilterModel) => void;
  onUpdateFilterGroup?: (group: 1 | 2, model: GridFilterModel) => void;
  onSetActiveGroup?: (group: 1 | 2) => void;
  onClearFilterGroup2?: () => void;
  // Delete action props
  onDeleteRow?: (rowId: string | number) => void;
  deleteDisabled?: boolean;
}

export function DataGridWrapper<T = Record<string, unknown>>({
  rows,
  columns,
  loading = false,
  getRowId,
  columnVisibilityModel,
  onFilterChange,
  comparisonMode = false,
  activeGroup = 1,
  activeFilterModel,
  filterGroup1Count = 0,
  filterGroup2Count = 0,
  onFilterModelChange: onFilterModelChangeFromProps,
  onSetActiveGroup,
  onClearFilterGroup2,
  onDeleteRow,
  deleteDisabled = false,
}: DataGridWrapperProps<T>) {
  const { session } = useSession();
  const apiRef = useGridApiRef();

  // Add delete action column if onDeleteRow is provided and user is logged in
  const columnsWithActions = useMemo(() => {
    if (!onDeleteRow || !session) {
      return columns;
    }

    const deleteColumn: GridColDef = {
      field: "actions",
      headerName: "",
      width: 50,
      sortable: false,
      filterable: false,
      hideable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        // Only show delete button if the row belongs to the logged-in user
        const rowUserId = (params.row as { user_id?: string }).user_id;
        const currentUserId = session?.user?.id;

        if (!rowUserId || !currentUserId || rowUserId !== currentUserId) {
          return null;
        }

        return (
          <IconButton
            size="small"
            onClick={() => onDeleteRow(params.id)}
            disabled={deleteDisabled}
            aria-label="delete"
            sx={{
              padding: "4px",
              "&:hover": {
                color: "error.main",
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        );
      },
    };

    return [...columns, deleteColumn];
  }, [columns, onDeleteRow, session, deleteDisabled]);

  const currentFilterModel = activeFilterModel ?? { items: [] };
  const resolveFilterValue = useMemo(
    () => createFilterValueResolver<T & Record<string, unknown>>(columnsWithActions),
    [columnsWithActions],
  );
  const filteredRows = useMemo(
    () =>
      applyGridFilterModel(
        rows as Array<T & Record<string, unknown>>,
        currentFilterModel,
        resolveFilterValue,
      ) as T[],
    [rows, currentFilterModel, resolveFilterValue],
  );

  // Use custom hook to handle DataGrid filtering
  // biome-ignore lint/suspicious/noExplicitAny: MUI type incompatibility between RefObject and MutableRefObject
  const [filteredData, handleFilterModelChange] = useDataGridFilter(apiRef as any, filteredRows);

  // Create a stable key based on filtered row IDs to detect actual filter changes
  const filteredDataKey = useMemo(() => {
    return filteredData.map((row) => getRowId(row)).join(",");
  }, [filteredData, getRowId]);

  // Call onFilterChange only when the visible row selection changes. Depending
  // on complete row objects here creates a feedback loop when parents derive rows.
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filteredData);
    }
  }, [filteredDataKey]);

  // Store the complete custom filter model outside MUI's single-filter community implementation.
  const handleFilterChange = (model: GridFilterModel) => {
    handleFilterModelChange(model);
    onFilterModelChangeFromProps?.(model);
  };

  // Handle filter group button clicks
  const handleFilterGroup1Click = () => {
    onSetActiveGroup?.(1);
  };

  const handleFilterGroup2Click = () => {
    onSetActiveGroup?.(2);
  };

  const theme = createTheme(
    {
      palette: {
        primary: { main: "#0d9488" },
      },
      shape: {
        borderRadius: 12,
      },
    },
    deDE,
  );

  return (
    <div className="data-grid-container">
      <ThemeProvider theme={theme}>
        <DataGrid
          apiRef={apiRef}
          rowHeight={20}
          rows={filteredRows}
          columns={columnsWithActions}
          loading={loading}
          getRowId={getRowId}
          initialState={{
            columns: {
              columnVisibilityModel: columnVisibilityModel || {},
            },
          }}
          disableColumnFilter
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
            toolbar: {
              userId: session?.user?.id,
              comparisonMode,
              activeGroup,
              filterGroup1Count:
                filterGroup1Count ||
                (activeGroup === 1 ? countActiveFilterItems(currentFilterModel) : 0),
              filterGroup2Count:
                filterGroup2Count ||
                (activeGroup === 2 ? countActiveFilterItems(currentFilterModel) : 0),
              onFilterGroup1Click: handleFilterGroup1Click,
              onFilterGroup2Click: handleFilterGroup2Click,
              onClearFilterGroup2,
              columns: columnsWithActions,
              filterModel: currentFilterModel,
              onFilterModelChange: handleFilterChange,
              // biome-ignore lint/suspicious/noExplicitAny: Custom comparison props not in MUI's type definition
            } as any,
          }}
          sx={{ border: "none" }}
        />
      </ThemeProvider>
    </div>
  );
}
