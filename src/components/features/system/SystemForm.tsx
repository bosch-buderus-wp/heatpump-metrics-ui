import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useModelCatalog } from "../../../hooks/useModelCatalog";
import {
  BUILDING_ENERGY_STANDARD_VALUES,
  BUILDING_TYPE_VALUES,
  getEnumOptions,
  SW_IDU_VALUES,
  SW_ODU_VALUES,
} from "../../../lib/enumCatalog";
import { DEFAULT_MODEL_FAMILY } from "../../../lib/modelFamilies";
import type { Database } from "../../../types/database.types";
import {
  EnumSelectField,
  NumberField,
  NumberInputWithUnit,
  SelectField,
  TextAreaField,
  TextField,
} from "../../form";
import { FieldHint } from "../../ui";

type HeatingSystem = Database["public"]["Tables"]["heating_systems"]["Row"];
type HeatingSystemInsert = Database["public"]["Tables"]["heating_systems"]["Insert"];

interface SystemFormProps {
  system?: HeatingSystem | null;
  onSubmit: (payload: HeatingSystemInsert) => void;
}

export function SystemForm({ system, onSubmit }: SystemFormProps) {
  const { t } = useTranslation();

  const catalog = useModelCatalog();
  const [modelError, setModelError] = useState(false);

  // Generate options from i18n translations
  const swIduOptions = getEnumOptions(t, "models.sw_idu", SW_IDU_VALUES);
  const swOduOptions = getEnumOptions(t, "models.sw_odu", SW_ODU_VALUES);

  // Determine if country is one of the predefined options
  const predefinedCountries = ["Deutschland", "Österreich", "Schweiz"];
  const initialCountry = system?.country ?? "";
  const isOtherCountry = initialCountry && !predefinedCountries.includes(initialCountry);

  const [form, setForm] = useState<Partial<HeatingSystem>>({
    model_family_id: system?.model_family_id ?? DEFAULT_MODEL_FAMILY,
    name: system?.name ?? "",
    postal_code: system?.postal_code ?? "",
    heating_type: system?.heating_type ?? "underfloorheating",
    model_idu: system ? system.model_idu : "CS5800i_E",
    model_odu: system ? system.model_odu : "5",
    sw_idu: system ? system.sw_idu : "12.11.1",
    sw_odu: system ? system.sw_odu : "9.15.0",
    heating_load_kw: system?.heating_load_kw ?? null,
    heated_area_m2: system?.heated_area_m2 ?? null,
    notes: system?.notes ?? "",
    building_construction_year: system?.building_construction_year ?? null,
    design_outdoor_temp_c: system?.design_outdoor_temp_c ?? null,
    building_type: system?.building_type ?? null,
    country: initialCountry,
    building_energy_standard: system?.building_energy_standard ?? null,
    thermometer_offset_k: system?.thermometer_offset_k ?? null,
    used_for_heating: system?.used_for_heating ?? true,
    used_for_dhw: system?.used_for_dhw ?? false,
    used_for_cooling: system?.used_for_cooling ?? false,
  });

  const family = form.model_family_id ?? DEFAULT_MODEL_FAMILY;
  const combinations =
    catalog.data?.combinations.filter((item) => item.model_family_id === family) ?? [];
  const modelIduOptions = [
    ...new Map(
      combinations.map((item) => {
        const key = `models.model_idu.${item.model_idu}`;
        const translated = t(key);
        return [
          item.model_idu,
          { value: item.model_idu, label: translated === key ? item.idu_label : translated },
        ];
      }),
    ).values(),
  ];
  const modelOduOptions = combinations
    .filter((item) => item.model_idu === form.model_idu)
    .map((item) => ({ value: item.model_odu, label: item.model_odu }))
    .sort((a, b) => Number(a.value) - Number(b.value));
  const unchangedModel =
    !!system &&
    family === (system.model_family_id ?? DEFAULT_MODEL_FAMILY) &&
    form.model_idu === system.model_idu &&
    form.model_odu === system.model_odu;
  const requiresCompleteModel = !unchangedModel;

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
        if (
          !catalog.data ||
          (!unchangedModel &&
            !combinations.some(
              (item) => item.model_idu === form.model_idu && item.model_odu === form.model_odu,
            ))
        ) {
          setModelError(true);
          return;
        }
        setModelError(false);
        onSubmit({
          ...form,
          ...(family !== DEFAULT_MODEL_FAMILY ? { sw_idu: null, sw_odu: null } : {}),
        } as HeatingSystemInsert);
      }}
    >
      <TextField
        label={t("systemForm.name")}
        value={form.name}
        onChange={(v) => set("name", v)}
        placeholder={t("systemForm.namePlaceholder")}
        required
        hint={t("systemForm.hints.name")}
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
          <div className="flex-center-gap-sm">
            <input
              value={form.country ?? ""}
              onChange={(e) => set("country", e.target.value || null)}
              placeholder={t("systemForm.countryPlaceholder")}
              className="flex-1"
            />
            <button
              type="button"
              className="btn button-padding-medium"
              onClick={() => {
                setCountryMode("dropdown");
                set("country", "");
              }}
            >
              ↩
            </button>
          </div>
        )}
        <FieldHint hint={t("systemForm.hints.country")} />
      </div>

      <TextField
        label={t("systemForm.postalCode")}
        value={form.postal_code}
        onChange={(v) => set("postal_code", v)}
        hint={t("systemForm.hints.postalCode")}
      />

      <NumberField
        label={t("systemForm.buildingConstructionYear")}
        value={form.building_construction_year}
        onChange={(v) => set("building_construction_year", v)}
        min={1800}
        max={2100}
        step={1}
        hint={t("systemForm.hints.buildingConstructionYear")}
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
        <FieldHint hint={t("systemForm.hints.heatedArea")} />
      </div>

      <EnumSelectField
        label={t("systemForm.buildingType")}
        value={form.building_type}
        onChange={(v) => set("building_type", (v as typeof form.building_type) ?? null)}
        enumKey="building_type"
        enumValues={BUILDING_TYPE_VALUES}
        translationPrefix="models.building_type"
        hint={t("systemForm.hints.buildingType")}
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
        hint={t("systemForm.hints.buildingEnergyStandard")}
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
        hint={t("systemForm.hints.heatingSystem")}
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
        <FieldHint hint={t("systemForm.hints.heatingLoad")} />
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
        <FieldHint hint={t("systemForm.hints.designOutdoorTemp")} />
      </div>

      <div className="row">
        <label htmlFor="system-thermometer-offset">{t("systemForm.thermometerOffset")}</label>
        <NumberInputWithUnit
          id="system-thermometer-offset"
          value={form.thermometer_offset_k}
          onChange={(v) => set("thermometer_offset_k", v)}
          unit="K"
          min={-20}
          max={20}
          step={0.1}
        />
        <FieldHint hint={t("systemForm.hints.thermometerOffset")} />
      </div>

      <SelectField
        label={t("modelFamily.label")}
        value={family}
        options={
          catalog.data?.families.map((item) => ({ value: item.id, label: item.label })) ?? []
        }
        emptyOption={false}
        required
        onChange={(value) => {
          if (value && value !== family) {
            setForm((previous) => ({
              ...previous,
              model_family_id: value,
              model_idu: null,
              model_odu: null,
              sw_idu: null,
              sw_odu: null,
            }));
            setModelError(false);
          }
        }}
      />
      {catalog.isLoading && <p>{t("common.loading")}</p>}
      {catalog.error && <p role="alert">{t("modelFamily.catalogError")}</p>}
      {modelError && <p role="alert">{t("modelFamily.invalidCombination")}</p>}
      <SelectField
        label={t("systemForm.indoorUnit")}
        value={form.model_idu}
        onChange={(v) =>
          setForm((previous) => ({
            ...previous,
            model_idu: v as HeatingSystem["model_idu"],
            model_odu: combinations.some(
              (item) => item.model_idu === v && item.model_odu === previous.model_odu,
            )
              ? previous.model_odu
              : null,
          }))
        }
        options={modelIduOptions}
        required={requiresCompleteModel}
        hint={t("systemForm.hints.modelIndoor")}
      />

      <SelectField
        label={t("systemForm.outdoorUnit")}
        value={form.model_odu}
        onChange={(v) => set("model_odu", (v as typeof form.model_odu) ?? null)}
        options={modelOduOptions}
        required={requiresCompleteModel}
        hint={t("systemForm.hints.modelOutdoor")}
      />

      {family === DEFAULT_MODEL_FAMILY && (
        <>
          <SelectField
            label={t("systemForm.softwareIndoor")}
            value={form.sw_idu}
            onChange={(v) => set("sw_idu", (v as typeof form.sw_idu) ?? null)}
            options={swIduOptions}
            hint={t("systemForm.hints.softwareIndoor")}
          />

          <SelectField
            label={t("systemForm.softwareOutdoor")}
            value={form.sw_odu}
            onChange={(v) => set("sw_odu", (v as typeof form.sw_odu) ?? null)}
            options={swOduOptions}
            hint={t("systemForm.hints.softwareOutdoor")}
          />
        </>
      )}

      <div className="row">
        <span>{t("systemForm.usageLabel")}</span>
        <div className="flex-center-gap-lg">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.used_for_heating ?? false}
              onChange={(e) => set("used_for_heating", e.target.checked)}
            />
            {t("systemForm.usedForHeating")}
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.used_for_dhw ?? false}
              onChange={(e) => set("used_for_dhw", e.target.checked)}
            />
            {t("systemForm.usedForDhw")}
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.used_for_cooling ?? false}
              onChange={(e) => set("used_for_cooling", e.target.checked)}
            />
            {t("systemForm.usedForCooling")}
          </label>
        </div>
        <FieldHint hint={t("systemForm.hints.usage")} />
      </div>

      <TextAreaField
        label={t("systemForm.notes")}
        value={form.notes}
        onChange={(v) => set("notes", v)}
        placeholder={t("systemForm.notesPlaceholder")}
        rows={3}
        hint={t("systemForm.hints.notes")}
      />
    </form>
  );
}
