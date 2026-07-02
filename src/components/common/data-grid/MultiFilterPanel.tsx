import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  type GridColDef,
  type GridFilterItem,
  type GridFilterModel,
  GridLogicOperator,
  type GridSingleSelectColDef,
} from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";

interface MultiFilterPanelProps {
  anchorEl: HTMLElement | null;
  columns: GridColDef[];
  groupColor: string;
  groupLabel: string;
  model: GridFilterModel;
  onChange: (model: GridFilterModel) => void;
  onClose: () => void;
}

const STRING_OPERATORS = [
  "contains",
  "equals",
  "startsWith",
  "endsWith",
  "isEmpty",
  "isNotEmpty",
] as const;
const NUMBER_OPERATORS = ["=", "!=", ">", ">=", "<", "<=", "isEmpty", "isNotEmpty"] as const;
const SELECT_OPERATORS = ["is", "not", "isEmpty", "isNotEmpty"] as const;
const BOOLEAN_OPERATORS = ["is"] as const;
const VALUELESS_OPERATORS = new Set(["isEmpty", "isNotEmpty"]);

function normalizeOperator(operator: string): string {
  if (operator === "=") return "equals";
  if (operator === "!=") return "doesNotEqual";
  return operator;
}

function getOperators(column: GridColDef | undefined): readonly string[] {
  if (column?.type === "number") return NUMBER_OPERATORS;
  if (column?.type === "singleSelect") return SELECT_OPERATORS;
  if (column?.type === "boolean") return BOOLEAN_OPERATORS;
  return STRING_OPERATORS;
}

function getDefaultOperator(column: GridColDef | undefined): string {
  return normalizeOperator(getOperators(column)[0]);
}

function nextFilterId(items: GridFilterItem[]): number {
  const numericIds = items
    .map((item) => (typeof item.id === "number" ? item.id : 0))
    .filter((id) => Number.isFinite(id));
  return Math.max(0, ...numericIds) + 1;
}

function createFilterItem(columns: GridColDef[], items: GridFilterItem[]): GridFilterItem {
  const column = columns[0];
  return {
    id: nextFilterId(items),
    field: column?.field ?? "",
    operator: getDefaultOperator(column),
    value: "",
  };
}

function getValueOptions(column: GridColDef | undefined) {
  const valueOptions = (column as GridSingleSelectColDef | undefined)?.valueOptions;
  if (!Array.isArray(valueOptions)) return [];
  return valueOptions.map((option) =>
    typeof option === "object" && option !== null && "value" in option
      ? { value: option.value, label: String(option.label ?? option.value) }
      : { value: option, label: String(option) },
  );
}

export function MultiFilterPanel({
  anchorEl,
  columns,
  groupColor,
  groupLabel,
  model,
  onChange,
  onClose,
}: MultiFilterPanelProps) {
  const { t } = useTranslation();
  const filterableColumns = columns.filter(
    (column) => column.filterable !== false && column.field !== "actions" && column.width !== 0,
  );
  const displayedItems =
    model.items.length > 0 ? model.items : [createFilterItem(filterableColumns, [])];

  const updateItems = (items: GridFilterItem[]) => {
    onChange({ items, logicOperator: GridLogicOperator.And });
  };

  const updateItem = (index: number, patch: Partial<GridFilterItem>) => {
    const items = displayedItems.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    );
    updateItems(items);
  };

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            width: { xs: "calc(100vw - 24px)", md: 760 },
            maxWidth: "calc(100vw - 24px)",
            border: `1px solid ${groupColor}`,
            borderRadius: 2,
            boxShadow: "0 18px 48px rgba(15, 23, 42, 0.18)",
          },
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Box sx={{ width: 4, height: 24, borderRadius: 4, bgcolor: groupColor }} />
            <Typography variant="subtitle2">{groupLabel}</Typography>
            <Typography variant="caption" color="text.secondary">
              {t("multiFilter.andHint")}
            </Typography>
          </Stack>
          <IconButton size="small" onClick={onClose} aria-label={t("common.close")}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <Divider />

      <Stack spacing={1.25} sx={{ p: 2 }}>
        {displayedItems.map((item, index) => {
          const column = filterableColumns.find((candidate) => candidate.field === item.field);
          const operators = getOperators(column);
          const valueOptions = getValueOptions(column);
          const needsValue = !VALUELESS_OPERATORS.has(item.operator);

          return (
            <Stack
              // Every item receives a stable ID before it is persisted.
              key={item.id ?? `${item.field}-${index}`}
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              sx={{ alignItems: { xs: "stretch", md: "center" } }}
            >
              <IconButton
                size="small"
                onClick={() =>
                  updateItems(displayedItems.filter((_, itemIndex) => itemIndex !== index))
                }
                aria-label={t("multiFilter.remove")}
                sx={{ alignSelf: { xs: "flex-end", md: "center" } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>

              <FormControl size="small" sx={{ flex: 1.3, minWidth: 170 }}>
                <InputLabel>{t("multiFilter.column")}</InputLabel>
                <Select
                  value={item.field}
                  label={t("multiFilter.column")}
                  onChange={(event) => {
                    const nextColumn = filterableColumns.find(
                      (candidate) => candidate.field === event.target.value,
                    );
                    updateItem(index, {
                      field: event.target.value,
                      operator: getDefaultOperator(nextColumn),
                      value: "",
                    });
                  }}
                >
                  {filterableColumns.map((candidate) => (
                    <MenuItem key={candidate.field} value={candidate.field}>
                      {candidate.headerName || candidate.field}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ flex: 1, minWidth: 150 }}>
                <InputLabel>{t("multiFilter.operator")}</InputLabel>
                <Select
                  value={item.operator}
                  label={t("multiFilter.operator")}
                  onChange={(event) =>
                    updateItem(index, {
                      operator: normalizeOperator(event.target.value),
                      value: VALUELESS_OPERATORS.has(event.target.value) ? undefined : item.value,
                    })
                  }
                >
                  {operators.map((operator) => {
                    const normalized = normalizeOperator(operator);
                    return (
                      <MenuItem key={operator} value={normalized}>
                        {t(`multiFilter.operators.${normalized}`)}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              {needsValue &&
                (column?.type === "singleSelect" || column?.type === "boolean" ? (
                  <FormControl size="small" sx={{ flex: 1.3, minWidth: 170 }}>
                    <InputLabel>{t("multiFilter.value")}</InputLabel>
                    <Select
                      value={item.value ?? ""}
                      label={t("multiFilter.value")}
                      onChange={(event) => updateItem(index, { value: event.target.value })}
                    >
                      {(column.type === "boolean"
                        ? [
                            { value: true, label: t("common.yes") },
                            { value: false, label: t("common.no") },
                          ]
                        : valueOptions
                      ).map((option) => (
                        <MenuItem key={String(option.value)} value={option.value as string}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    size="small"
                    label={t("multiFilter.value")}
                    value={item.value ?? ""}
                    type={column?.type === "number" ? "number" : "text"}
                    onChange={(event) =>
                      updateItem(index, {
                        value:
                          column?.type === "number" && event.target.value !== ""
                            ? Number(event.target.value)
                            : event.target.value,
                      })
                    }
                    sx={{ flex: 1.3, minWidth: 170 }}
                  />
                ))}
            </Stack>
          );
        })}
      </Stack>

      <Divider />

      <Stack direction="row" sx={{ px: 2, py: 1.25, justifyContent: "space-between" }}>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() =>
            updateItems([...displayedItems, createFilterItem(filterableColumns, displayedItems)])
          }
        >
          {t("multiFilter.add")}
        </Button>
        <Button
          size="small"
          color="inherit"
          startIcon={<DeleteIcon />}
          onClick={() => updateItems([])}
          disabled={model.items.length === 0}
        >
          {t("multiFilter.removeAll")}
        </Button>
      </Stack>
    </Popover>
  );
}
