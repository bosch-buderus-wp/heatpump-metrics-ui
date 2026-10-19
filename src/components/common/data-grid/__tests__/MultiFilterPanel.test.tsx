import { fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { describe, expect, it, vi } from "vitest";
import { getAllDataGridColumns } from "../../../../lib/tableHelpers";
import { MultiFilterPanel } from "../MultiFilterPanel";

describe("MultiFilterPanel", () => {
  it("offers numeric comparisons for the building construction year", () => {
    const onChange = vi.fn();
    render(<button type="button">Filter</button>);

    render(
      <MultiFilterPanel
        anchorEl={screen.getByRole("button", { name: "Filter" })}
        columns={[getAllDataGridColumns(i18n.t).buildingConstructionYear]}
        groupColor="#123456"
        groupLabel="Filter group"
        model={{
          items: [{ id: 1, field: "building_construction_year", operator: "equals", value: 2000 }],
        }}
        onChange={onChange}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("spinbutton")).toHaveValue(2000);
    fireEvent.mouseDown(screen.getAllByRole("combobox")[1]);

    for (const operator of [">", ">=", "<", "<="]) {
      expect(
        screen.getByRole("option", { name: `multiFilter.operators.${operator}` }),
      ).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("option", { name: "multiFilter.operators.>" }));
    expect(onChange).toHaveBeenLastCalledWith({
      items: [{ id: 1, field: "building_construction_year", operator: ">", value: 2000 }],
      logicOperator: "and",
    });
  });
});
