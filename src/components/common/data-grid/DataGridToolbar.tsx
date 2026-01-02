import CancelIcon from "@mui/icons-material/Cancel";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import {
  Badge,
  Box,
  Divider,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  ColumnsPanelTrigger,
  ExportCsv,
  ExportPrint,
  QuickFilter,
  QuickFilterClear,
  QuickFilterControl,
  QuickFilterTrigger,
  Toolbar,
  ToolbarButton,
  useGridApiContext,
} from "@mui/x-data-grid";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { COMPARISON_COLORS } from "../../../hooks/useComparisonFilters";

interface DataGridToolbarInternalProps {
  userId?: string | null;
  // Comparison mode props
  comparisonMode?: boolean;
  activeGroup?: 1 | 2;
  filterGroup1Count?: number;
  filterGroup2Count?: number;
  onFilterGroup1Click?: () => void;
  onFilterGroup2Click?: () => void;
  onClearFilterGroup2?: () => void;
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

function DataGridToolbarInternal({
  userId,
  comparisonMode = false,
  activeGroup = 1,
  filterGroup1Count = 0,
  filterGroup2Count = 0,
  onFilterGroup1Click,
  onFilterGroup2Click,
  onClearFilterGroup2,
}: DataGridToolbarInternalProps) {
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

      {/* Comparison Filter Groups */}
      <Tooltip title={comparisonMode ? t("toolbar.filter1") : t("toolbar.filters")}>
        <Box
          sx={{
            border: activeGroup === 1 ? `2px solid ${COMPARISON_COLORS.group1}` : "none",
            borderRadius: 1,
            display: "inline-flex",
          }}
        >
          <ToolbarButton onClick={onFilterGroup1Click}>
            <Badge badgeContent={filterGroup1Count} color="success" variant="dot">
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <FilterListIcon fontSize="small" sx={{ color: COMPARISON_COLORS.group1 }} />
                {comparisonMode && (
                  <Typography
                    variant="caption"
                    sx={{ color: COMPARISON_COLORS.group1, fontWeight: "bold" }}
                  >
                    1
                  </Typography>
                )}
              </Box>
            </Badge>
          </ToolbarButton>
        </Box>
      </Tooltip>

      <Tooltip title={t("toolbar.filter2")}>
        <Box
          sx={{
            border: activeGroup === 2 ? `2px solid ${COMPARISON_COLORS.group2}` : "none",
            borderRadius: 1,
            opacity: comparisonMode ? 1 : 0.5,
            display: "inline-flex",
          }}
        >
          <ToolbarButton onClick={onFilterGroup2Click}>
            <Badge badgeContent={filterGroup2Count} color="success" variant="dot">
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <FilterListIcon fontSize="small" sx={{ color: COMPARISON_COLORS.group2 }} />
                <Typography
                  variant="caption"
                  sx={{ color: COMPARISON_COLORS.group2, fontWeight: "bold" }}
                >
                  2
                </Typography>
              </Box>
            </Badge>
          </ToolbarButton>
        </Box>
      </Tooltip>

      {comparisonMode && onClearFilterGroup2 && (
        <Tooltip title={t("toolbar.clearFilter2")}>
          <ToolbarButton onClick={onClearFilterGroup2} size="small">
            <CancelIcon fontSize="small" sx={{ color: COMPARISON_COLORS.group2 }} />
          </ToolbarButton>
        </Tooltip>
      )}

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
export const DataGridToolbar: React.FC<DataGridToolbarInternalProps> = (props) => {
  return <DataGridToolbarInternal {...props} />;
};
