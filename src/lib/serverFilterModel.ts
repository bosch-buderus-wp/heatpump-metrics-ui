import type { GridFilterItem, GridFilterModel } from "@mui/x-data-grid";

export interface ServerFilterItem {
  field: string;
  operator: string;
  value?: boolean | number | string | Array<boolean | number | string> | null;
}

export interface ServerFilterModel {
  logic: "and" | "or";
  items: ServerFilterItem[];
}

const FIELD_ALIASES: Record<string, string> = {
  azHeating: "az_heating",
};

const NUMBER_FIELDS = new Set([
  "heated_area_m2",
  "heating_load_kw",
  "design_outdoor_temp_c",
  "building_construction_year",
  "az",
  "az_heating",
  "outdoor_temperature_c",
  "flow_temperature_c",
  "thermal_energy_kwh",
  "electrical_energy_kwh",
  "thermal_energy_heating_kwh",
  "electrical_energy_heating_kwh",
]);

const BOOLEAN_FIELDS = new Set(["used_for_heating", "used_for_dhw", "used_for_cooling"]);

const ARRAY_OPERATORS = new Set(["isAnyOf"]);
const EMPTY_OPERATORS = new Set(["isEmpty", "isNotEmpty"]);

function normalizeField(field: string) {
  return FIELD_ALIASES[field] ?? field;
}

function normalizeScalarValue(field: string, rawValue: unknown) {
  if (BOOLEAN_FIELDS.has(field)) {
    if (typeof rawValue === "boolean") return rawValue;
    if (rawValue === "true") return true;
    if (rawValue === "false") return false;
    return null;
  }

  if (NUMBER_FIELDS.has(field)) {
    const parsed =
      typeof rawValue === "number"
        ? rawValue
        : typeof rawValue === "string"
          ? Number(rawValue)
          : Number.NaN;

    return Number.isFinite(parsed) ? parsed : null;
  }

  if (rawValue == null) return null;
  return String(rawValue);
}

function sanitizeFilterItem(item: GridFilterItem): ServerFilterItem | null {
  if (!item.field || !item.operator) return null;

  const field = normalizeField(item.field);
  const operator = item.operator;

  if (EMPTY_OPERATORS.has(operator)) {
    return { field, operator };
  }

  if (item.value === undefined || item.value === null || item.value === "") {
    return null;
  }

  if (ARRAY_OPERATORS.has(operator)) {
    if (!Array.isArray(item.value) || item.value.length === 0) return null;
    const values = item.value
      .map((value) => normalizeScalarValue(field, value))
      .filter((value): value is boolean | number | string => value !== null && value !== undefined);

    return values.length > 0 ? { field, operator, value: values } : null;
  }

  const value = normalizeScalarValue(field, item.value);
  if (value === null) return null;

  return { field, operator, value };
}

export function sanitizeGridFilterModel(model?: GridFilterModel | null): ServerFilterModel {
  const logicOperator = model?.logicOperator;
  const logic = logicOperator === "or" ? "or" : "and";
  const items = (model?.items ?? [])
    .map((item) => sanitizeFilterItem(item))
    .filter((item): item is ServerFilterItem => item !== null);

  return { logic, items };
}
