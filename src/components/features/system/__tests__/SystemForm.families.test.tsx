import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SystemForm } from "../SystemForm";

vi.mock("../../../../hooks/useModelCatalog", async () => {
  const { modelCatalogFixture } = await import("../../../../test/modelCatalogFixture");
  return { useModelCatalog: () => ({ data: modelCatalogFixture, isLoading: false, error: null }) };
});
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
function select(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
describe("family configuration", () => {
  it("clears devices and firmware when changing family, hides firmware, and submits only a valid pair", () => {
    const onSubmit = vi.fn();
    const { container } = render(<SystemForm onSubmit={onSubmit} />);
    expect(screen.getByLabelText("systemForm.softwareIndoor")).toHaveValue("12.11.1");
    select("modelFamily.label", "cs8800");
    expect(screen.getByLabelText("systemForm.indoorUnit")).toHaveValue("");
    expect(screen.getByLabelText("systemForm.outdoorUnit")).toHaveValue("");
    expect(screen.queryByLabelText("systemForm.softwareIndoor")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("systemForm.softwareOutdoor")).not.toBeInTheDocument();
    fireEvent.submit(container.querySelector("form")!);
    expect(onSubmit).not.toHaveBeenCalled();
    select("systemForm.indoorUnit", "WLW186i_MBE_PLUS_E");
    select("systemForm.outdoorUnit", "13");
    fireEvent.submit(container.querySelector("form")!);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        model_family_id: "cs8800",
        model_idu: "WLW186i_MBE_PLUS_E",
        model_odu: "13",
        sw_idu: null,
        sw_odu: null,
      }),
    );
    select("modelFamily.label", "cs5800_6800");
    expect(screen.getByLabelText("systemForm.softwareIndoor")).toHaveValue("");
    expect(screen.getByLabelText("systemForm.softwareOutdoor")).toHaveValue("");
  });
  it("offers brand-specific type classes and clears an incompatible type when changing indoor unit", () => {
    render(<SystemForm onSubmit={vi.fn()} />);
    select("modelFamily.label", "cs7001");
    select("systemForm.indoorUnit", "CS7001i_AWE");
    const outdoor = screen.getByLabelText("systemForm.outdoorUnit") as HTMLSelectElement;
    expect([...outdoor.options].map((option) => option.value)).toEqual([
      "",
      "5",
      "7",
      "9",
      "13",
      "17",
    ]);
    select("systemForm.outdoorUnit", "7");
    select("systemForm.indoorUnit", "WLW196i_E");
    expect(outdoor).toHaveValue("");
    expect([...outdoor.options].map((option) => option.value)).toEqual([
      "",
      "4",
      "6",
      "8",
      "11",
      "14",
    ]);
    expect(screen.queryByRole("option", { name: "WLW186i MBE+ E" })).not.toBeInTheDocument();
  });
});
