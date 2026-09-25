import { render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";
import type { Database } from "../../../../types/database.types";
import { MonthlyEditor } from "../MonthlyEditor";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

type HeatingSystem = Database["public"]["Tables"]["heating_systems"]["Row"];
type MonthlyValue = Database["public"]["Tables"]["monthly_values"]["Row"];

const month = Number(dayjs().subtract(1, "month").format("M"));
const year = Number(dayjs().subtract(1, "month").format("YYYY"));
const system = { heating_id: "system-1" } as HeatingSystem;

function renderMonthlyValue(thermalEnergy: number, heatingEnergy: number) {
  const value = {
    id: "monthly-1",
    heating_id: system.heating_id,
    month,
    year,
    electrical_energy_kwh: 38.1,
    thermal_energy_kwh: thermalEnergy,
    electrical_energy_heating_kwh: 17.8,
    thermal_energy_heating_kwh: heatingEnergy,
  } as MonthlyValue;

  render(<MonthlyEditor system={system} values={[value]} onSave={vi.fn()} />);
}

describe("MonthlyEditor energy validation", () => {
  it("does not report a COP error for zero heat with positive standby electricity", () => {
    renderMonthlyValue(74.8, 0);

    expect(screen.queryByText(/monthlyForm\.errorCopLessThanOne/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /common\.save/ })).toBeEnabled();
  });

  it("does not report a COP error when total heat is zero", () => {
    renderMonthlyValue(0, 0);

    expect(screen.queryByText(/monthlyForm\.errorCopLessThanOne/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /common\.save/ })).toBeEnabled();
  });

  it("still rejects positive heat below electricity consumption", () => {
    renderMonthlyValue(74.8, 10);

    expect(screen.getAllByText(/monthlyForm\.errorCopLessThanOne/)).toHaveLength(2);
    expect(screen.getByRole("button", { name: /common\.save/ })).toBeDisabled();
  });
});
