import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Database } from "../../../types/database.types";
import { MonthYearPicker, NumberInputWithUnit } from "../../form";
import { FieldHint } from "../../ui";
import { ActionBar, type ActionButton } from "../../ui/ActionBar";

type HeatingSystem = Database["public"]["Tables"]["heating_systems"]["Row"];
type MonthlyValue = Database["public"]["Tables"]["monthly_values"]["Row"];
type MonthlyValueInsert = Database["public"]["Tables"]["monthly_values"]["Insert"];

interface MonthlyEditorProps {
  system: HeatingSystem;
  values: MonthlyValue[];
  onSave: (val: MonthlyValueInsert) => Promise<void>;
  onDeleteClick?: (id: string) => void;
  feedback?: { type: "success" | "error"; message: string } | null;
}

export function MonthlyEditor({
  system,
  values,
  onSave,
  onDeleteClick,
  feedback,
}: MonthlyEditorProps) {
  const { t } = useTranslation();
  const [m, setM] = useState(Number(dayjs().subtract(1, "month").format("M")));
  const [y, setY] = useState(Number(dayjs().subtract(1, "month").format("YYYY")));

  type MonthlyForm = Partial<MonthlyValue>;
  const [form, setForm] = useState<MonthlyForm>({
    electrical_energy_kwh: null,
    thermal_energy_kwh: null,
    electrical_energy_heating_kwh: null,
    thermal_energy_heating_kwh: null,
    outdoor_temperature_c: null,
    flow_temperature_c: null,
    outdoor_temperature_min_c: null,
    outdoor_temperature_max_c: null,
  });

  const existing = values.find((v) => Number(v.month) === m && v.year === y);

  useEffect(() => {
    if (existing) {
      const { id, heating_id, created_at, month, year, ...rest } = existing;
      setForm(rest);
    } else {
      setForm({
        electrical_energy_kwh: null,
        thermal_energy_kwh: null,
        electrical_energy_heating_kwh: null,
        thermal_energy_heating_kwh: null,
        outdoor_temperature_c: null,
        flow_temperature_c: null,
        outdoor_temperature_min_c: null,
        outdoor_temperature_max_c: null,
      });
    }
  }, [existing]);

  function setField<K extends keyof MonthlyValue>(k: K, v: MonthlyValue[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Validation: Check if COP (Arbeitszahl) >= 1
  const validationErrors: Record<string, string> = {};

  // Validate total energy: thermal >= electrical (COP >= 1)
  if (
    form.electrical_energy_kwh != null &&
    form.thermal_energy_kwh != null &&
    form.electrical_energy_kwh > 0 &&
    form.thermal_energy_kwh < form.electrical_energy_kwh
  ) {
    validationErrors.thermal_energy_kwh = t("monthlyForm.errorCopLessThanOne");
    validationErrors.electrical_energy_kwh = t("monthlyForm.errorCopLessThanOne");
  }

  // Validate heating energy: thermal >= electrical (COP >= 1)
  if (
    form.electrical_energy_heating_kwh != null &&
    form.thermal_energy_heating_kwh != null &&
    form.electrical_energy_heating_kwh > 0 &&
    form.thermal_energy_heating_kwh < form.electrical_energy_heating_kwh
  ) {
    validationErrors.thermal_energy_heating_kwh = t("monthlyForm.errorCopLessThanOne");
    validationErrors.electrical_energy_heating_kwh = t("monthlyForm.errorCopLessThanOne");
  }

  // Validate heating cannot exceed total
  if (
    form.electrical_energy_kwh != null &&
    form.electrical_energy_heating_kwh != null &&
    form.electrical_energy_heating_kwh > form.electrical_energy_kwh
  ) {
    validationErrors.electrical_energy_heating_kwh = t("monthlyForm.errorHeatingExceedsTotal");
  }

  if (
    form.thermal_energy_kwh != null &&
    form.thermal_energy_heating_kwh != null &&
    form.thermal_energy_heating_kwh > form.thermal_energy_kwh
  ) {
    validationErrors.thermal_energy_heating_kwh = t("monthlyForm.errorHeatingExceedsTotal");
  }

  const hasErrors = Object.keys(validationErrors).length > 0;

  const handleSaveClick = () => {
    const payload: MonthlyValueInsert = {
      heating_id: system.heating_id,
      month: m,
      year: y,
      ...form,
    };
    if (existing?.id) {
      (payload as MonthlyValue).id = existing.id;
    }
    onSave(payload);
  };

  const actions: ActionButton[] = [
    {
      label: t("common.save"),
      onClick: handleSaveClick,
      variant: "primary",
      disabled: hasErrors,
      icon: "💾",
    },
  ];

  if (existing?.id && onDeleteClick) {
    actions.push({
      label: t("deleteConfirm.deleteMonthlyValue"),
      onClick: () => onDeleteClick(String(existing.id)),
      variant: "danger",
      icon: "🗑️",
    });
  }

  return (
    <div className="card">
      <MonthYearPicker
        month={m}
        year={y}
        onChange={({ month, year }) => {
          setM(month);
          setY(year);
        }}
      />

      {existing?.last_auto_calculated_at && (
        <div className="monthly-editor-info-box">
          ℹ️{" "}
          {t("monthlyForm.autoCalculatedInfo", {
            date: new Date(existing.last_auto_calculated_at).toLocaleString("de-DE", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }),
          })}
        </div>
      )}

      <div className="monthly-editor-fields-container">
        {[
          {
            k: "electrical_energy_kwh",
            l: t("monthlyForm.electricalEnergy"),
            unit: "kWh",
            hint: "electricalEnergy",
          },
          {
            k: "thermal_energy_kwh",
            l: t("monthlyForm.thermalEnergy"),
            unit: "kWh",
            hint: "thermalEnergy",
          },
          {
            k: "electrical_energy_heating_kwh",
            l: t("monthlyForm.electricalEnergyHeating"),
            unit: "kWh",
            hint: "electricalEnergyHeating",
          },
          {
            k: "thermal_energy_heating_kwh",
            l: t("monthlyForm.thermalEnergyHeating"),
            unit: "kWh",
            hint: "thermalEnergyHeating",
          },
          {
            k: "outdoor_temperature_c",
            l: t("monthlyForm.outdoorTempAvg"),
            unit: "°C",
            hint: "outdoorTempAvg",
          },
          {
            k: "outdoor_temperature_min_c",
            l: t("monthlyForm.outdoorTempMin"),
            unit: "°C",
            hint: "outdoorTempMin",
          },
          {
            k: "outdoor_temperature_max_c",
            l: t("monthlyForm.outdoorTempMax"),
            unit: "°C",
            hint: "outdoorTempMax",
          },
          {
            k: "flow_temperature_c",
            l: t("monthlyForm.flowTempAvg"),
            unit: "°C",
            hint: "flowTempAvg",
          },
        ].map(({ k, l, unit, hint }) => {
          const hasError = validationErrors[k];
          const fieldId = `monthly-field-${k}`;
          return (
            <div key={k} className="row wide">
              <label htmlFor={fieldId}>{l}</label>
              <div className="monthly-editor-field-wrapper">
                <NumberInputWithUnit
                  id={fieldId}
                  value={(form[k as keyof MonthlyValue] as number) ?? null}
                  onChange={(value) => setField(k as keyof MonthlyValue, value)}
                  unit={unit}
                  hasError={hasError !== undefined}
                  displayDecimals={1}
                />
                {hasError && <span className="monthly-editor-error">⚠ {hasError}</span>}
              </div>
              {hint && <FieldHint hint={t(`monthlyForm.hints.${hint}`)} />}
            </div>
          );
        })}
      </div>

      <ActionBar actions={actions} feedback={feedback} />
    </div>
  );
}
