import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EnumSelectField } from "../EnumSelectField";

describe("EnumSelectField", () => {
  const mockEnumValues = ["option1", "option2", "option3"];
  const defaultProps = {
    label: "Building Type",
    value: null,
    onChange: vi.fn(),
    enumKey: "building_type",
    enumValues: mockEnumValues,
    translationPrefix: "models.building_type",
  };

  it("renders with label", () => {
    render(<EnumSelectField {...defaultProps} />);

    expect(screen.getByLabelText("Building Type")).toBeInTheDocument();
  });

  it("generates id from enumKey", () => {
    render(<EnumSelectField {...defaultProps} />);

    const select = screen.getByLabelText("Building Type");
    expect(select).toHaveAttribute("id", "select-field-building_type");
  });

  it("renders empty option", () => {
    render(<EnumSelectField {...defaultProps} />);

    const select = screen.getByLabelText("Building Type") as HTMLSelectElement;
    expect(select.options[0].value).toBe("");
    expect(select.options[0].textContent).toBe("-");
  });

  it("renders all enum options with translations", () => {
    render(<EnumSelectField {...defaultProps} />);

    // Empty option + 3 enum options
    const select = screen.getByLabelText("Building Type") as HTMLSelectElement;
    expect(select.options).toHaveLength(4);
  });

  it("translates option labels using translationPrefix", () => {
    render(<EnumSelectField {...defaultProps} />);

    // Options should use translation keys like "models.building_type.option1"
    expect(screen.getByText("models.building_type.option1")).toBeInTheDocument();
    expect(screen.getByText("models.building_type.option2")).toBeInTheDocument();
    expect(screen.getByText("models.building_type.option3")).toBeInTheDocument();
  });

  it("sets selected value correctly", () => {
    render(<EnumSelectField {...defaultProps} value="option2" />);

    const select = screen.getByLabelText("Building Type") as HTMLSelectElement;
    expect(select.value).toBe("option2");
  });

  it("handles null value as empty string", () => {
    render(<EnumSelectField {...defaultProps} value={null} />);

    const select = screen.getByLabelText("Building Type") as HTMLSelectElement;
    expect(select.value).toBe("");
  });

  it("handles undefined value as empty string", () => {
    render(<EnumSelectField {...defaultProps} value={undefined} />);

    const select = screen.getByLabelText("Building Type") as HTMLSelectElement;
    expect(select.value).toBe("");
  });

  it("calls onChange with selected value", () => {
    const handleChange = vi.fn();
    render(<EnumSelectField {...defaultProps} onChange={handleChange} />);

    const select = screen.getByLabelText("Building Type");
    fireEvent.change(select, { target: { value: "option1" } });

    expect(handleChange).toHaveBeenCalledWith("option1");
  });

  it("calls onChange with null when empty option selected", () => {
    const handleChange = vi.fn();
    render(<EnumSelectField {...defaultProps} value="option1" onChange={handleChange} />);

    const select = screen.getByLabelText("Building Type");
    fireEvent.change(select, { target: { value: "" } });

    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it("renders with empty enumValues array", () => {
    render(<EnumSelectField {...defaultProps} enumValues={[]} />);

    const select = screen.getByLabelText("Building Type") as HTMLSelectElement;
    expect(select.options).toHaveLength(1); // Only empty option
  });

  it("uses correct translation key format", () => {
    render(
      <EnumSelectField
        {...defaultProps}
        translationPrefix="models.energy_standard"
        enumValues={["standard1"]}
      />,
    );

    expect(screen.getByText("models.energy_standard.standard1")).toBeInTheDocument();
  });
});
