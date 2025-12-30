import { useMemo, useState, useCallback } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { AzBarChart, type ChartDataRow } from "../components/common/charts";
import { PageLayout } from "../components/common/layout";
import { DataGridWrapper } from "../components/common/data-grid";
import { getAllDataGridColumns, commonHiddenColumns, computeAz } from "../lib/tableHelpers";
import { useComparisonMode } from "../hooks/useComparisonMode";
import { flattenHeatingSystemsFields } from "../lib/dataTransformers";

export default function Yearly() {
  const { t } = useTranslation();
  const defaultYear = Number(dayjs().subtract(1, "month").format("YYYY"));
  const [year, setYear] = useState(defaultYear);
  const [filteredData, setFilteredData] = useState<Array<Record<string, unknown>>>([]);

  // Wrap setFilteredData in useCallback to prevent infinite loops in DataGridWrapper
  const handleFilterChange = useCallback((data: Array<Record<string, unknown>>) => {
    setFilteredData(data);
  }, []);

  // Define columns specific to Yearly page (az will be computed from monthly_values)
  const columns = useMemo(() => {
    const cols = getAllDataGridColumns(t);
    return [
      cols.user_id,
      cols.month,
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
      cols.az,
      cols.azHeating,
      cols.outdoorTemperature,
      cols.flowTemperature,
    ];
  }, [t]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["yearly", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_values")
        .select("*, heating_systems(*)")
        .eq("year", year);

      if (error) throw error;
      return data;
    },
  });

  const years = useMemo(() => {
    const y = [];
    for (let yy = 2025; yy <= 2050; yy++) y.push(yy);
    return y;
  }, []);

  // Calculate AZ values from energy data and prepare for display
  const sortedData = useMemo(() => {
    if (!data) return [];

    // Add calculated AZ values to each row using the shared computeAz function
    // Also flatten heating_systems fields to top level for filtering
    return data.map((row) => {
      const { az, azHeating } = computeAz(row);
      return flattenHeatingSystemsFields({
        ...row,
        az,
        az_heating: azHeating,
      });
    });
  }, [data]);

  // Comparison mode hook - handles all filter logic
  const {
    comparisonMode,
    comparisonGroupsForChart,
    filteredDataForChart,
    dataGridComparisonProps,
  } = useComparisonMode(sortedData);

  return (
    <PageLayout
      titleKey="yearly.title"
      infoKey="yearly.info"
      error={error}
      isLoading={isLoading}
      filters={
        <div className="row picker">
          <label htmlFor="yearly-year-select">{t("common.year")}</label>
          <select
            id="yearly-year-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      }
      chart={
        <AzBarChart
          data={comparisonMode ? [] : ((filteredDataForChart || filteredData) as ChartDataRow[])}
          comparisonGroups={comparisonGroupsForChart}
          indexField="month"
          indexLabel="common.month"
          indexValues={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]}
          aggregateData={true}
        />
      }
    >
      <DataGridWrapper
        rows={sortedData}
        columns={columns}
        loading={isLoading}
        getRowId={(row) =>
          typeof row.id === "string" || typeof row.id === "number"
            ? row.id
            : `${row.heating_id}-${row.month}-${row.year}`
        }
        columnVisibilityModel={commonHiddenColumns}
        onFilterChange={handleFilterChange}
        {...dataGridComparisonProps}
      />
    </PageLayout>
  );
}
