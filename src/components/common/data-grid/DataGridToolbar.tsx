import { useState, useRef, useEffect } from "react";
import { styled } from "@mui/material/styles";
import {
  Toolbar,
  ToolbarButton,
  ColumnsPanelTrigger,
  FilterPanelTrigger,
  ExportCsv,
  ExportPrint,
  QuickFilter,
  QuickFilterControl,
  QuickFilterClear,
  QuickFilterTrigger,
  useGridApiContext,
} from "@mui/x-data-grid";
import { Tooltip, Menu, MenuItem, Badge, Divider, TextField, InputAdornment } from "@mui/material";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CancelIcon from "@mui/icons-material/Cancel";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import { useTranslation } from "react-i18next";

interface DataGridToolbarInternalProps {
  userId?: string | null;
}

type OwnerState = {
  expanded: boolean;
};

const StyledQuickFilter = styled(QuickFilter)({
  display: "grid",
  alignItems: "center",
});

const StyledToolbarButton = styled(ToolbarButton)<{ ownerState: OwnerState }>(
  ({ theme, ownerState }) => ({
    gridArea: "1 / 1",
    width: "min-content",
    height: "min-content",
    zIndex: 1,
    opacity: ownerState.expanded ? 0 : 1,
    pointerEvents: ownerState.expanded ? "none" : "auto",
    transition: theme.transitions.create(["opacity"]),
  }),
);

const StyledTextField = styled(TextField)<{
  ownerState: OwnerState;
}>(({ theme, ownerState }) => ({
  gridArea: "1 / 1",
  overflowX: "clip",
  width: ownerState.expanded ? 260 : "var(--trigger-width)",
  opacity: ownerState.expanded ? 1 : 0,
  transition: theme.transitions.create(["width", "opacity"]),
}));

function DataGridToolbarInternal({ userId }: DataGridToolbarInternalProps) {
  const { t } = useTranslation();
  const apiRef = useGridApiContext();
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const [filterActive, setFilterActive] = useState(false);

  // Listen to filter model changes to update our state
  useEffect(() => {
    const handleFilterChange = () => {
      const currentFilterModel = apiRef.current?.state?.filter?.filterModel;
      const hasUserFilter =
        currentFilterModel?.items?.some(
          (item) => item.field === "user_id" && item.value === userId,
        ) ?? false;
      setFilterActive(hasUserFilter);
    };

    const unsubscribe = apiRef.current?.subscribeEvent("filterModelChange", handleFilterChange);

    // Check initial state
    handleFilterChange();

    return () => {
      unsubscribe?.();
    };
  }, [apiRef, userId]);

  const isFiltered = filterActive;

  const handleToggleUserFilter = () => {
    if (!userId) return;

    const currentModel = apiRef.current.state.filter.filterModel;

    if (isFiltered) {
      // Remove the user filter
      const newItems = currentModel.items.filter((item) => item.field !== "user_id");
      apiRef.current.setFilterModel({
        ...currentModel,
        items: newItems,
      });
    } else {
      // Add the user filter
      apiRef.current.setFilterModel({
        ...currentModel,
        items: [
          ...currentModel.items,
          {
            field: "user_id",
            operator: "equals",
            value: userId,
          },
        ],
      });
    }
  };

  return (
    <Toolbar>
      <Tooltip title={t("toolbar.columns")}>
        <ColumnsPanelTrigger render={<ToolbarButton />}>
          <ViewColumnIcon fontSize="small" />
        </ColumnsPanelTrigger>
      </Tooltip>

      <Tooltip title={t("toolbar.filters")}>
        <FilterPanelTrigger
          render={(props, state) => (
            <ToolbarButton {...props} color="default">
              <Badge badgeContent={state.filterCount} color="primary" variant="dot">
                <FilterListIcon fontSize="small" />
              </Badge>
            </ToolbarButton>
          )}
        />
      </Tooltip>

      <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title={t("toolbar.export")}>
        <ToolbarButton
          ref={exportMenuTriggerRef}
          id="export-menu-trigger"
          aria-controls="export-menu"
          aria-haspopup="true"
          aria-expanded={exportMenuOpen ? "true" : undefined}
          onClick={() => setExportMenuOpen(true)}
        >
          <FileDownloadIcon fontSize="small" />
        </ToolbarButton>
      </Tooltip>

      <Menu
        id="export-menu"
        anchorEl={exportMenuTriggerRef.current}
        open={exportMenuOpen}
        onClose={() => setExportMenuOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          list: {
            "aria-labelledby": "export-menu-trigger",
          },
        }}
      >
        <ExportPrint render={<MenuItem />} onClick={() => setExportMenuOpen(false)}>
          {t("toolbar.print")}
        </ExportPrint>
        <ExportCsv render={<MenuItem />} onClick={() => setExportMenuOpen(false)}>
          {t("toolbar.downloadCsv")}
        </ExportCsv>
      </Menu>

      {userId && (
        <>
          <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title={isFiltered ? t("toolbar.showAllSystems") : t("toolbar.showMySystems")}>
            <ToolbarButton onClick={handleToggleUserFilter}>
              <Badge variant="dot" color="primary" invisible={!isFiltered}>
                <PersonIcon
                  fontSize="small"
                  sx={{
                    color: isFiltered ? "primary.main !important" : "action.active !important",
                    transition: "color 0.2s",
                  }}
                />
              </Badge>
            </ToolbarButton>
          </Tooltip>
        </>
      )}

      <StyledQuickFilter>
        <QuickFilterTrigger
          render={(triggerProps, state) => (
            <Tooltip title={t("toolbar.search")} enterDelay={0}>
              <StyledToolbarButton
                {...triggerProps}
                ownerState={{ expanded: state.expanded }}
                color="default"
                aria-disabled={state.expanded}
              >
                <SearchIcon fontSize="small" />
              </StyledToolbarButton>
            </Tooltip>
          )}
        />
        <QuickFilterControl
          render={({ ref, ...controlProps }, state) => (
            <StyledTextField
              {...controlProps}
              ownerState={{ expanded: state.expanded }}
              inputRef={ref}
              aria-label={t("toolbar.search")}
              placeholder={t("toolbar.searchPlaceholder")}
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: state.value ? (
                    <InputAdornment position="end">
                      <QuickFilterClear
                        edge="end"
                        size="small"
                        aria-label={t("toolbar.clearSearch")}
                        material={{ sx: { marginRight: -0.75 } }}
                      >
                        <CancelIcon fontSize="small" />
                      </QuickFilterClear>
                    </InputAdornment>
                  ) : null,
                  ...controlProps.slotProps?.input,
                },
                ...controlProps.slotProps,
              }}
            />
          )}
        />
      </StyledQuickFilter>
    </Toolbar>
  );
}

// Export the toolbar component directly with proper typing
export const DataGridToolbar: React.FC<DataGridToolbarInternalProps> = ({ userId }) => {
  return <DataGridToolbarInternal userId={userId} />;
};
