import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DataGrid, type GridColDef, type GridFilterModel, useGridApiRef } from "@mui/x-data-grid";
import { deDE } from "@mui/x-data-grid/locales";
import { useEffect, useMemo } from "react";
import { useDataGridFilter } from "../../../hooks/useDataGridFilter";
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
  onUpdateFilterGroup,
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

  // Handle filter model changes - always use comparison mode handler if provided
  const handleFilterChange = (model: GridFilterModel) => {
    // Always call the hook's handler to update filtered data for charts
    handleFilterModelChange(model);

    // Also call the comparison mode handler if provided
    if (onFilterModelChangeFromProps) {
      onFilterModelChangeFromProps(model);
    }
  };

  // Sync filter model when switching groups or when activeFilterModel changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: activeGroup is needed to trigger on group switch
  useEffect(() => {
    if (apiRef.current && activeFilterModel) {
      apiRef.current.setFilterModel(activeFilterModel);
    }
  }, [comparisonMode, activeGroup, activeFilterModel, apiRef]);

  // Handle filter group button clicks
  const handleFilterGroup1Click = () => {
    if (!apiRef.current) return;

    // If in comparison mode, handle group switching
    if (comparisonMode && onSetActiveGroup) {
      const currentModel = apiRef.current.state.filter.filterModel;

      // Save current filter model to the CURRENT active group before switching
      if (onUpdateFilterGroup && activeGroup !== 1) {
        onUpdateFilterGroup(activeGroup, currentModel);
      }

      // Always switch to group 1 immediately - the sync effect will handle applying filters
      onSetActiveGroup(1);

      // Open filter panel after a brief delay to allow state update and sync
      setTimeout(() => {
        apiRef.current?.showFilterPanel();
      }, 100);
    } else {
      // Simple mode: just open the filter panel
      apiRef.current.showFilterPanel();
    }
  };

  const handleFilterGroup2Click = () => {
    if (apiRef.current && onSetActiveGroup) {
      const currentModel = apiRef.current.state.filter.filterModel;

      // Save current filter model to the CURRENT active group before switching
      if (onUpdateFilterGroup && activeGroup !== 2) {
        onUpdateFilterGroup(activeGroup, currentModel);
      }

      // Always switch to group 2 immediately - the sync effect will handle applying filters
      onSetActiveGroup(2);

      // Open filter panel after a brief delay to allow state update and sync
      setTimeout(() => {
        apiRef.current?.showFilterPanel();
      }, 100);
    }
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
          rows={rows}
          columns={columnsWithActions}
          loading={loading}
          getRowId={getRowId}
          initialState={{
            columns: {
              columnVisibilityModel: columnVisibilityModel || {},
            },
          }}
          onFilterModelChange={handleFilterChange}
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
              filterGroup1Count,
              filterGroup2Count,
              onFilterGroup1Click: handleFilterGroup1Click,
              onFilterGroup2Click: handleFilterGroup2Click,
              onClearFilterGroup2,
              // biome-ignore lint/suspicious/noExplicitAny: Custom comparison props not in MUI's type definition
            } as any,
          }}
          sx={{ border: "none" }}
        />
      </ThemeProvider>
    </div>
  );
}
