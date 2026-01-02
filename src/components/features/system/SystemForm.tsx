import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BUILDING_ENERGY_STANDARD_VALUES,
  BUILDING_TYPE_VALUES,
  getEnumOptions,
  MODEL_IDU_VALUES,
  MODEL_ODU_VALUES,
  SW_IDU_VALUES,
  SW_ODU_VALUES,
} from "../../../lib/enumCatalog";
import type { Database } from "../../../types/database.types";
import {
  EnumSelectField,
  NumberField,
  NumberInputWithUnit,
  SelectField,
  TextAreaField,
  TextField,
} from "../../form";

type HeatingSystem = Database["public"]["Tables"]["heating_systems"]["Row"];
type HeatingSystemInsert = Database["public"]["Tables"]["heating_systems"]["Insert"];

interface SystemFormProps {
  system?: HeatingSystem | null;
  onSubmit: (payload: HeatingSystemInsert) => void;
}

export function SystemForm({ system, onSubmit }: SystemFormProps) {
  const { t } = useTranslation();

  // Generate options from i18n translations
  const modelIduOptions = getEnumOptions(t, "models.model_idu", MODEL_IDU_VALUES);
  const modelOduOptions = getEnumOptions(t, "models.model_odu", MODEL_ODU_VALUES);
  const swIduOptions = getEnumOptions(t, "models.sw_idu", SW_IDU_VALUES);
  const swOduOptions = getEnumOptions(t, "models.sw_odu", SW_ODU_VALUES);

  // Determine if country is one of the predefined options
  const predefinedCountries = ["Deutschland", "Österreich", "Schweiz"];
  const initialCountry = system?.country ?? "";
  const isOtherCountry = initialCountry && !predefinedCountries.includes(initialCountry);

  const [form, setForm] = useState<Partial<HeatingSystem>>({
    name: system?.name ?? "",
    postal_code: system?.postal_code ?? "",
    heating_type: system?.heating_type ?? "underfloorheating",
    model_idu: system?.model_idu ?? "CS5800i_E",
    model_odu: system?.model_odu ?? "5",
    sw_idu: system?.sw_idu ?? "12.11.1",
    sw_odu: system?.sw_odu ?? "9.15.0",
    heating_load_kw: system?.heating_load_kw ?? null,
    heated_area_m2: system?.heated_area_m2 ?? null,
    notes: system?.notes ?? "",
    building_construction_year: system?.building_construction_year ?? null,
    design_outdoor_temp_c: system?.design_outdoor_temp_c ?? null,
    building_type: system?.building_type ?? null,
    country: initialCountry,
    building_energy_standard: system?.building_energy_standard ?? null,
    used_for_heating: system?.used_for_heating ?? true,
    used_for_dhw: system?.used_for_dhw ?? false,
    used_for_cooling: system?.used_for_cooling ?? false,
  });

  const [countryMode, setCountryMode] = useState<"dropdown" | "text">(
    isOtherCountry ? "text" : "dropdown",
  );

  function set<K extends keyof HeatingSystem>(k: K, v: HeatingSystem[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <form
      id="system-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form as HeatingSystemInsert);
      }}
    >
      <TextField
        label={t("systemForm.name")}
        value={form.name}
        onChange={(v) => set("name", v)}
        placeholder={t("systemForm.namePlaceholder")}
        required
      />

      <div className="row">
        <label htmlFor="system-country">{t("systemForm.country")}</label>
        {countryMode === "dropdown" ? (
          <select
            id="system-country"
            value={form.country ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "__other__") {
                setCountryMode("text");
                set("country", "");
              } else {
                set("country", value || null);
              }
            }}
          >
            <option value="">-</option>
            <option value="Deutschland">{t("systemForm.countries.germany")}</option>
            <option value="Österreich">{t("systemForm.countries.austria")}</option>
            <option value="Schweiz">{t("systemForm.countries.switzerland")}</option>
            <option value="__other__">{t("systemForm.countries.other")}</option>
          </select>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              value={form.country ?? ""}
              onChange={(e) => set("country", e.target.value || null)}
              placeholder={t("systemForm.countryPlaceholder")}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn"
              onClick={() => {
                setCountryMode("dropdown");
                set("country", "");
              }}
              style={{ padding: "0.5rem 1rem" }}
            >
              ↩
            </button>
          </div>
        )}
      </div>

      <TextField
        label={t("systemForm.postalCode")}
        value={form.postal_code}
        onChange={(v) => set("postal_code", v)}
      />

      <NumberField
        label={t("systemForm.buildingConstructionYear")}
        value={form.building_construction_year}
        onChange={(v) => set("building_construction_year", v)}
        min={1800}
        max={2100}
        step={1}
      />

      <div className="row">
        <label htmlFor="system-heated-area">{t("systemForm.heatedArea")}</label>
        <NumberInputWithUnit
          id="system-heated-area"
          value={form.heated_area_m2}
          onChange={(v) => set("heated_area_m2", v)}
          unit="m²"
          step={1}
        />
      </div>

      <EnumSelectField
        label={t("systemForm.buildingType")}
        value={form.building_type}
        onChange={(v) => set("building_type", (v as typeof form.building_type) ?? null)}
        enumKey="building_type"
        enumValues={BUILDING_TYPE_VALUES}
        translationPrefix="models.building_type"
      />

      <EnumSelectField
        label={t("systemForm.buildingEnergyStandard")}
        value={form.building_energy_standard}
        onChange={(v) =>
          set("building_energy_standard", (v as typeof form.building_energy_standard) ?? null)
        }
        enumKey="building_energy_standard"
        enumValues={BUILDING_ENERGY_STANDARD_VALUES}
        translationPrefix="models.building_energy_standard"
      />

      <SelectField
        label={t("systemForm.heatingSystem")}
        value={form.heating_type}
        onChange={(v) => set("heating_type", (v as typeof form.heating_type) ?? null)}
        options={[
          { value: "underfloorheating", label: t("models.heating_type.underfloorheating") },
          { value: "radiators", label: t("models.heating_type.radiators") },
          { value: "mixed", label: t("models.heating_type.mixed") },
        ]}
        emptyOption={false}
      />

      <div className="row">
        <label htmlFor="system-heating-load">{t("systemForm.heatingLoad")}</label>
        <NumberInputWithUnit
          id="system-heating-load"
          value={form.heating_load_kw}
          onChange={(v) => set("heating_load_kw", v)}
          unit="kW"
          step="any"
        />
      </div>

      <div className="row">
        <label htmlFor="system-design-outdoor-temp">{t("systemForm.designOutdoorTemp")}</label>
        <NumberInputWithUnit
          id="system-design-outdoor-temp"
          value={form.design_outdoor_temp_c}
          onChange={(v) => set("design_outdoor_temp_c", v)}
          unit="°C"
          min={-50}
          max={30}
          step={0.1}
        />
      </div>

      <SelectField
        label={t("systemForm.indoorUnit")}
        value={form.model_idu}
        onChange={(v) => set("model_idu", (v as typeof form.model_idu) ?? null)}
        options={modelIduOptions}
        emptyOption={false}
      />

      <SelectField
        label={t("systemForm.outdoorUnit")}
        value={form.model_odu}
        onChange={(v) => set("model_odu", (v as typeof form.model_odu) ?? null)}
        options={modelOduOptions}
        emptyOption={false}
      />

      <SelectField
        label={t("systemForm.softwareIndoor")}
        value={form.sw_idu}
        onChange={(v) => set("sw_idu", (v as typeof form.sw_idu) ?? null)}
        options={swIduOptions}
        emptyOption={false}
      />

      <SelectField
        label={t("systemForm.softwareOutdoor")}
        value={form.sw_odu}
        onChange={(v) => set("sw_odu", (v as typeof form.sw_odu) ?? null)}
        options={swOduOptions}
        emptyOption={false}
      />

      <div className="row">
        <span>{t("systemForm.usageLabel")}</span>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "auto" }}>
            <input
              type="checkbox"
              checked={form.used_for_heating ?? false}
              onChange={(e) => set("used_for_heating", e.target.checked)}
            />
            {t("systemForm.usedForHeating")}
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "auto" }}>
            <input
              type="checkbox"
              checked={form.used_for_dhw ?? false}
              onChange={(e) => set("used_for_dhw", e.target.checked)}
            />
            {t("systemForm.usedForDhw")}
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "auto" }}>
            <input
              type="checkbox"
              checked={form.used_for_cooling ?? false}
              onChange={(e) => set("used_for_cooling", e.target.checked)}
            />
            {t("systemForm.usedForCooling")}
          </label>
        </div>
      </div>

      <TextAreaField
        label={t("systemForm.notes")}
        value={form.notes}
        onChange={(v) => set("notes", v)}
        placeholder={t("systemForm.notesPlaceholder")}
        rows={3}
      />
    </form>
  );
}
