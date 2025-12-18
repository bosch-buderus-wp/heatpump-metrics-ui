import { useState, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useTranslation } from "react-i18next";
import type { Database } from "../types/database.types";
import { AzBarChart, type ChartDataRow } from "../components/common/charts";
import { PageLayout } from "../components/common/layout";
import { DataGridWrapper } from "../components/common/data-grid";
import { getAllDataGridColumns, commonHiddenColumns } from "../lib/tableHelpers";

type MeasurementRow = Database["public"]["Tables"]["measurements"]["Row"];

export default function Daily() {
  const { t } = useTranslation();
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [filteredData, setFilteredData] = useState<MeasurementRow[]>([]);

  // Wrap setFilteredData in useCallback to prevent infinite loops in DataGridWrapper
  const handleFilterChange = useCallback((data: MeasurementRow[]) => {
    setFilteredData(data);
  }, []);

  // Define columns specific to Daily page
  const columns = useMemo(() => {
    const cols = getAllDataGridColumns(t);
    return [
      cols.user_id,
      cols.time,
      cols.name,
      cols.postalCode,
      cols.country,
      cols.heatingType,
      cols.modelIdu,
      cols.modelOdu,
      cols.swIdu,
      cols.swOdu,
      cols.heatingLoad,
      cols.heatedArea,
      cols.buildingConstructionYear,
      cols.designOutdoorTemp,
      cols.buildingType,
      cols.buildingEnergyStandard,
      cols.usedForHeating,
      cols.usedForDhw,
      cols.usedForCooling,
      cols.thermalEnergy,
      cols.electricalEnergy,
      cols.thermalEnergyHeating,
      cols.electricalEnergyHeating,
      cols.outdoorTemperature,
      cols.flowTemperature,
    ];
  }, [t]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["measurements", date],
    queryFn: async () => {
      const start = dayjs(date).startOf("day").toISOString();
      const end = dayjs(date).endOf("day").toISOString();
      const { data, error } = await supabase
        .from("measurements")
        .select("*, heating_systems(*)")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Sort data (not used)
  const sortedData = useMemo(() => {
    if (!data) return [];
    return data;
  }, [data]);

  // Calculate hourly aggregated data with AZ from differences
  const hourlyData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    // Group data by heating system and hour
    const grouped: Record<string, Record<number, MeasurementRow[]>> = {};

    for (const row of filteredData) {
      const heatingId = row.heating_id;
      const hour = dayjs(row.created_at).hour();

      if (!grouped[heatingId]) {
        grouped[heatingId] = {};
      }
      if (!grouped[heatingId][hour]) {
        grouped[heatingId][hour] = [];
      }
      grouped[heatingId][hour].push(row);
    }

    // Calculate AZ for each heating system and hour based on differences
    const hourlyResults: Array<Record<string, unknown>> = [];

    for (const heatingId of Object.keys(grouped)) {
      const hours = Object.keys(grouped[heatingId])
        .map(Number)
        .sort((a, b) => a - b);

      for (let i = 0; i < hours.length; i++) {
        const currentHour = hours[i];
        const currentMeasurements = grouped[heatingId][currentHour];

        // Get last measurement of current hour
        const currentLast = currentMeasurements[currentMeasurements.length - 1];

        // Find previous hour's last measurement
        let previousLast = null;
        for (let j = i - 1; j >= 0; j--) {
          const prevHourMeasurements = grouped[heatingId][hours[j]];
          if (prevHourMeasurements && prevHourMeasurements.length > 0) {
            previousLast = prevHourMeasurements[prevHourMeasurements.length - 1];
            break;
          }
        }

        if (previousLast && currentLast) {
          // Calculate differences
          const deltaETotal =
            (currentLast.electrical_energy_kwh || 0) - (previousLast.electrical_energy_kwh || 0);
          const deltaTTotal =
            (currentLast.thermal_energy_kwh || 0) - (previousLast.thermal_energy_kwh || 0);
          const deltaEHeating =
            (currentLast.electrical_energy_heating_kwh || 0) -
            (previousLast.electrical_energy_heating_kwh || 0);
          const deltaTHeating =
            (currentLast.thermal_energy_heating_kwh || 0) -
            (previousLast.thermal_energy_heating_kwh || 0);

          // Calculate AZ
          const az = deltaETotal > 0 ? deltaTTotal / deltaETotal : 0;
          const azHeating = deltaEHeating > 0 ? deltaTHeating / deltaEHeating : 0;

          hourlyResults.push({
            hour: currentHour.toString(),
            heating_id: heatingId,
            az: az,
            az_heating: azHeating,
            outdoor_temperature_c: currentLast.outdoor_temperature_c,
            flow_temperature_c: currentLast.flow_temperature_c,
          });
        }
      }
    }

    return hourlyResults;
  }, [filteredData]);

  return (
    <PageLayout
      titleKey="daily.title"
      infoKey="daily.info"
      error={error}
      isLoading={isLoading}
      filters={
        <div className="row picker">
          <label htmlFor="daily-date-picker">{t("common.date")}</label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setDate(dayjs(date).subtract(1, "day").format("YYYY-MM-DD"))}
              title={t("common.previousDay") || "Previous day"}
              style={{ padding: "0px 2px", cursor: "pointer" }}
            >
              ◀
            </button>
            <input
              id="daily-date-picker"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setDate(dayjs(date).add(1, "day").format("YYYY-MM-DD"))}
              title={t("common.nextDay") || "Next day"}
              style={{ padding: "0px 2px", cursor: "pointer" }}
            >
              ▶
            </button>
          </div>
        </div>
      }
      chart={
        <AzBarChart
          data={hourlyData as ChartDataRow[]}
          indexField="hour"
          indexLabel="common.hour"
          indexValues={[
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
            "13",
            "14",
            "15",
            "16",
            "17",
            "18",
            "19",
            "20",
            "21",
            "22",
            "23",
          ]}
          aggregateData={true}
          averageAz={true}
        />
      }
    >
      <DataGridWrapper
        rows={sortedData}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.id}
        columnVisibilityModel={commonHiddenColumns}
        onFilterChange={handleFilterChange}
      />
    </PageLayout>
  );
}
