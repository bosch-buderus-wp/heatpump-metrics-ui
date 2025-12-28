import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SelectField } from "../SelectField";

describe("SelectField", () => {
  const mockOptions = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  it("renders with label and options", () => {
    render(<SelectField label="Choice" value={null} onChange={vi.fn()} options={mockOptions} />);

    expect(screen.getByLabelText("Choice")).toBeInTheDocument();
    const select = screen.getByLabelText("Choice") as HTMLSelectElement;
    expect(select.options).toHaveLength(4); // Empty option + 3 options
  });

  it("shows empty option by default", () => {
    render(<SelectField label="Choice" value={null} onChange={vi.fn()} options={mockOptions} />);

    const select = screen.getByLabelText("Choice") as HTMLSelectElement;
    expect(select.options[0].value).toBe("");
    expect(select.options[0].textContent).toBe("-");
  });

  it("hides empty option when emptyOption is false", () => {
    render(
      <SelectField
        label="Choice"
        value={null}
        onChange={vi.fn()}
        options={mockOptions}
        emptyOption={false}
      />,
    );

    const select = screen.getByLabelText("Choice") as HTMLSelectElement;
    expect(select.options).toHaveLength(3); // Only the 3 options
    expect(select.options[0].value).toBe("option1");
  });

  it("renders all option labels correctly", () => {
    render(<SelectField label="Choice" value={null} onChange={vi.fn()} options={mockOptions} />);

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  it("sets selected value correctly", () => {
    render(<SelectField label="Choice" value="option2" onChange={vi.fn()} options={mockOptions} />);

    const select = screen.getByLabelText("Choice") as HTMLSelectElement;
    expect(select.value).toBe("option2");
  });

  it("calls onChange with selected value", () => {
    const handleChange = vi.fn();
    render(
      <SelectField label="Choice" value={null} onChange={handleChange} options={mockOptions} />,
    );

    const select = screen.getByLabelText("Choice");
    fireEvent.change(select, { target: { value: "option1" } });

    expect(handleChange).toHaveBeenCalledWith("option1");
  });

  it("calls onChange with null when empty option selected", () => {
    const handleChange = vi.fn();
    render(
      <SelectField label="Choice" value="option1" onChange={handleChange} options={mockOptions} />,
    );

    const select = screen.getByLabelText("Choice");
    fireEvent.change(select, { target: { value: "" } });

    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it("handles empty options array", () => {
    render(<SelectField label="Choice" value={null} onChange={vi.fn()} options={[]} />);

    const select = screen.getByLabelText("Choice") as HTMLSelectElement;
    expect(select.options).toHaveLength(1); // Only empty option
  });

  it("marks field as required when required prop is true", () => {
    render(
      <SelectField label="Choice" value={null} onChange={vi.fn()} options={mockOptions} required />,
    );

    const select = screen.getByLabelText("Choice");
    expect(select).toBeRequired();
  });

  it("generates unique id from label", () => {
    render(<SelectField label="User Type" value={null} onChange={vi.fn()} options={mockOptions} />);

    const select = screen.getByLabelText("User Type");
    expect(select).toHaveAttribute("id", "select-field-user-type");
  });

  it("handles null value with empty option", () => {
    render(<SelectField label="Choice" value={null} onChange={vi.fn()} options={mockOptions} />);

    const select = screen.getByLabelText("Choice") as HTMLSelectElement;
    expect(select.value).toBe("");
  });

  it("handles undefined value as empty", () => {
    render(
      <SelectField label="Choice" value={undefined} onChange={vi.fn()} options={mockOptions} />,
    );

    const select = screen.getByLabelText("Choice") as HTMLSelectElement;
    expect(select.value).toBe("");
  });
});
