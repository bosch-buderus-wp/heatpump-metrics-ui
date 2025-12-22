import type { TFunction } from "i18next";
import dayjs from "dayjs";
import type { GridColDef } from "@mui/x-data-grid";

/**
 * Common column visibility settings for hiding system details across all pages
 */
export const commonHiddenColumns: Record<string, boolean> = {
  user_id: false,
  postal_code: false,
  country: false,
  heating_type: false,
  model_idu: false,
  model_odu: false,
  sw_idu: false,
  sw_odu: false,
  heating_load_kw: false,
  heated_area_m2: false,
  building_construction_year: false,
  design_outdoor_temp_c: false,
  building_type: false,
  building_energy_standard: false,
  used_for_heating: false,
  used_for_dhw: false,
  used_for_cooling: false,
};
import {
  getHeatingTypeLabel,
  getModelIduLabel,
  getModelOduLabel,
  getSwIduLabel,
  getSwOduLabel,
  getBuildingTypeLabel,
  getBuildingEnergyStandardLabel,
} from "./enumCatalog";

interface EnergyRow {
  thermal_energy_kwh?: number | null;
  electrical_energy_kwh?: number | null;
  thermal_energy_heating_kwh?: number | null;
  electrical_energy_heating_kwh?: number | null;
}

/**
 * Compute Arbeitszahl (COP) values from energy data
 */
export function computeAz(row: EnergyRow) {
  const {
    thermal_energy_kwh,
    electrical_energy_kwh,
    thermal_energy_heating_kwh,
    electrical_energy_heating_kwh,
  } = row;
  const az = electrical_energy_kwh
    ? (thermal_energy_kwh ?? 0) / (electrical_energy_kwh || 1)
    : null;
  const azHeating = electrical_energy_heating_kwh
    ? (thermal_energy_heating_kwh ?? 0) / (electrical_energy_heating_kwh || 1)
    : null;
  return { az, azHeating };
}

/**
 * All available MUI DataGrid column definitions
 * Use these to build consistent tables across all views with MUI DataGrid
 */
export function getAllDataGridColumns(t: TFunction): Record<string, GridColDef> {
  return {
    // Hidden columns for filtering
    user_id: {
      field: "user_id",
      headerName: t("tableHeaders.userId"),
      width: 0,
      filterable: true,
      hideable: false,
    },

    // System identification columns
    name: {
      field: "name",
      headerName: t("tableHeaders.system"),
      width: 170,
      valueGetter: (_value, row) => row.heating_systems?.name ?? row.name ?? "-",
    },
    heatingType: {
      field: "heating_type",
      headerName: t("tableHeaders.heatingType"),
      width: 130,
      valueGetter: (_value, row) =>
        getHeatingTypeLabel(t, row.heating_systems?.heating_type ?? row.heating_type),
    },
    modelIdu: {
      field: "model_idu",
      headerName: t("tableHeaders.modelIdu"),
      width: 160,
      valueGetter: (_value, row) =>
        getModelIduLabel(t, row.heating_systems?.model_idu ?? row.model_idu),
    },
    modelOdu: {
      field: "model_odu",
      headerName: t("tableHeaders.modelOdu"),
      width: 60,
      valueGetter: (_value, row) =>
        getModelOduLabel(t, row.heating_systems?.model_odu ?? row.model_odu),
    },

    // Time-based columns
    month: {
      field: "month",
      headerName: t("common.month"),
      width: 80,
      type: "number",
    },
    date: {
      field: "date",
      headerName: t("common.date"),
      width: 120,
    },
    time: {
      field: "created_at",
      headerName: t("common.time"),
      width: 80,
      valueGetter: (value) => dayjs(value).format("HH:mm"),
    },

    // Performance metrics
    az: {
      field: "az",
      headerName: t("tableHeaders.az"),
      width: 150,
      type: "number",
      valueGetter: (_value, row) => {
        // If az is already in the row (from daily_values view), use it directly
        if (row.az != null) return row.az;
        // Otherwise compute it from energy fields
        const { az } = computeAz(row);
        return az ?? null;
      },
      valueFormatter: (value: number | null) => (value != null ? value.toFixed(2) : "-"),
    },
    azHeating: {
      field: "azHeating",
      headerName: t("tableHeaders.azHeating"),
      width: 160,
      type: "number",
      valueGetter: (_value, row) => {
        // If az_heating is already in the row (from daily_values view), use it directly
        if (row.az_heating != null) return row.az_heating;
        // Otherwise compute it from energy fields
        const { azHeating } = computeAz(row);
        return azHeating ?? null;
      },
      valueFormatter: (value: number | null) => (value != null ? value.toFixed(2) : "-"),
    },

    // Temperature columns
    outdoorTemperature: {
      field: "outdoor_temperature_c",
      headerName: t("tableHeaders.outdoorTemperature"),
      width: 130,
      type: "number",
      valueFormatter: (value: number | null) => (value != null ? `${value.toFixed(1)} °C` : "-"),
    },
    flowTemperature: {
      field: "flow_temperature_c",
      headerName: t("tableHeaders.flowTemperature"),
      width: 130,
      type: "number",
      valueFormatter: (value: number | null) => (value != null ? `${value.toFixed(1)} °C` : "-"),
    },

    // Energy columns (for hourly view)
    thermalEnergy: {
      field: "thermal_energy_kwh",
      headerName: t("tableHeaders.thermalEnergy"),
      width: 120,
      type: "number",
      valueFormatter: (value: number | null) => (value != null ? `${value.toFixed(1)} kWh` : "-"),
    },
    electricalEnergy: {
      field: "electrical_energy_kwh",
      headerName: t("tableHeaders.electricalEnergy"),
      width: 120,
      type: "number",
      valueFormatter: (value: number | null) => (value != null ? `${value.toFixed(1)} kWh` : "-"),
    },
    thermalEnergyHeating: {
      field: "thermal_energy_heating_kwh",
      headerName: t("tableHeaders.thermalEnergyHeating"),
      width: 120,
      type: "number",
      valueFormatter: (value: number | null) => (value != null ? `${value.toFixed(1)} kWh` : "-"),
    },
    electricalEnergyHeating: {
      field: "electrical_energy_heating_kwh",
      headerName: t("tableHeaders.electricalEnergyHeating"),
      width: 120,
      type: "number",
      valueFormatter: (value: number | null) => (value != null ? `${value.toFixed(1)} kWh` : "-"),
    },

    // System-specific columns
    postalCode: {
      field: "postal_code",
      headerName: t("tableHeaders.postalCode"),
      width: 60,
      type: "number",
      valueGetter: (_value, row) => row.heating_systems?.postal_code ?? row.postal_code ?? null,
    },
    swIdu: {
      field: "sw_idu",
      headerName: t("tableHeaders.swIdu"),
      width: 120,
      valueGetter: (_value, row) => getSwIduLabel(t, row.heating_systems?.sw_idu ?? row.sw_idu),
    },
    swOdu: {
      field: "sw_odu",
      headerName: t("tableHeaders.swOdu"),
      width: 80,
      valueGetter: (_value, row) => getSwOduLabel(t, row.heating_systems?.sw_odu ?? row.sw_odu),
    },
    heatingLoad: {
      field: "heating_load_kw",
      headerName: t("tableHeaders.heatingLoad"),
      width: 70,
      type: "number",
      valueGetter: (_value, row) =>
        row.heating_systems?.heating_load_kw ?? row.heating_load_kw ?? null,
      valueFormatter: (value: number | null) => (value != null ? `${value.toFixed(0)} kW` : "-"),
    },
    heatedArea: {
      field: "heated_area_m2",
      headerName: t("tableHeaders.heatedArea"),
      width: 80,
      type: "number",
      valueGetter: (_value, row) =>
        row.heating_systems?.heated_area_m2 ?? row.heated_area_m2 ?? null,
      valueFormatter: (value: number | null) => (value != null ? `${value.toFixed(0)} m²` : "-"),
    },
    buildingConstructionYear: {
      field: "building_construction_year",
      headerName: t("systemForm.buildingConstructionYear"),
      width: 100,
      valueGetter: (_value, row) =>
        row.heating_systems?.building_construction_year ?? row.building_construction_year ?? null,
      valueFormatter: (value: number | null) => (value != null ? String(value) : "-"),
    },
    designOutdoorTemp: {
      field: "design_outdoor_temp_c",
      headerName: t("systemForm.designOutdoorTemp"),
      width: 150,
      type: "number",
      valueGetter: (_value, row) =>
        row.heating_systems?.design_outdoor_temp_c ?? row.design_outdoor_temp_c ?? null,
      valueFormatter: (value: number | null) => (value != null ? `${value.toFixed(1)} °C` : "-"),
    },
    buildingType: {
      field: "building_type",
      headerName: t("systemForm.buildingType"),
      width: 180,
      valueGetter: (_value, row) =>
        getBuildingTypeLabel(t, row.heating_systems?.building_type ?? row.building_type),
    },
    country: {
      field: "country",
      headerName: t("systemForm.country"),
      width: 120,
      valueGetter: (_value, row) => row.heating_systems?.country ?? row.country ?? "-",
    },
    buildingEnergyStandard: {
      field: "building_energy_standard",
      headerName: t("systemForm.buildingEnergyStandard"),
      width: 180,
      valueGetter: (_value, row) =>
        getBuildingEnergyStandardLabel(
          t,
          row.heating_systems?.building_energy_standard ?? row.building_energy_standard,
        ),
    },
    usedForHeating: {
      field: "used_for_heating",
      headerName: t("systemForm.usedForHeating"),
      width: 100,
      type: "boolean",
      valueGetter: (_value, row) =>
        row.heating_systems?.used_for_heating ?? row.used_for_heating ?? null,
    },
    usedForDhw: {
      field: "used_for_dhw",
      headerName: t("systemForm.usedForDhw"),
      width: 120,
      type: "boolean",
      valueGetter: (_value, row) => row.heating_systems?.used_for_dhw ?? row.used_for_dhw ?? null,
    },
    usedForCooling: {
      field: "used_for_cooling",
      headerName: t("systemForm.usedForCooling"),
      width: 100,
      type: "boolean",
      valueGetter: (_value, row) =>
        row.heating_systems?.used_for_cooling ?? row.used_for_cooling ?? null,
    },
  };
}
