import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NumberField } from "../NumberField";

describe("NumberField", () => {
  it("renders with label and value", () => {
    render(<NumberField label="Temperature" value={25} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Temperature")).toBeInTheDocument();
    expect(screen.getByLabelText("Temperature")).toHaveValue(25);
  });

  it("renders with null value as empty", () => {
    render(<NumberField label="Temperature" value={null} onChange={vi.fn()} />);

    const input = screen.getByLabelText("Temperature");
    expect(input).toHaveValue(null);
  });

  it("renders with undefined value as empty", () => {
    render(<NumberField label="Temperature" value={undefined} onChange={vi.fn()} />);

    const input = screen.getByLabelText("Temperature");
    expect(input).toHaveValue(null);
  });

  it("calls onChange with number when value changes", () => {
    const handleChange = vi.fn();

    render(<NumberField label="Temperature" value={null} onChange={handleChange} />);

    const input = screen.getByLabelText("Temperature") as HTMLInputElement;

    // Simulate user typing by changing the input value
    fireEvent.change(input, { target: { value: "42" } });

    expect(handleChange).toHaveBeenCalledWith(42);
  });

  it("calls onChange with null when input is cleared", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<NumberField label="Temperature" value={25} onChange={handleChange} />);

    const input = screen.getByLabelText("Temperature");
    await user.clear(input);

    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it("handles negative numbers", () => {
    const handleChange = vi.fn();

    render(<NumberField label="Temperature" value={null} onChange={handleChange} />);

    const input = screen.getByLabelText("Temperature") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "-10" } });

    expect(handleChange).toHaveBeenCalledWith(-10);
  });

  it("handles decimal numbers", () => {
    const handleChange = vi.fn();

    render(<NumberField label="Temperature" value={null} onChange={handleChange} step={0.1} />);

    const input = screen.getByLabelText("Temperature") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "3.5" } });

    expect(handleChange).toHaveBeenCalledWith(3.5);
  });

  it("applies min attribute", () => {
    render(<NumberField label="Temperature" value={25} onChange={vi.fn()} min={0} />);

    const input = screen.getByLabelText("Temperature") as HTMLInputElement;
    expect(input.min).toBe("0");
  });

  it("applies max attribute", () => {
    render(<NumberField label="Temperature" value={25} onChange={vi.fn()} max={100} />);

    const input = screen.getByLabelText("Temperature") as HTMLInputElement;
    expect(input.max).toBe("100");
  });

  it("applies step attribute with default value of 1", () => {
    render(<NumberField label="Temperature" value={25} onChange={vi.fn()} />);

    const input = screen.getByLabelText("Temperature") as HTMLInputElement;
    expect(input.step).toBe("1");
  });

  it("applies custom step attribute", () => {
    render(<NumberField label="Temperature" value={25} onChange={vi.fn()} step={0.5} />);

    const input = screen.getByLabelText("Temperature") as HTMLInputElement;
    expect(input.step).toBe("0.5");
  });

  it("applies step attribute as string", () => {
    render(<NumberField label="Temperature" value={25} onChange={vi.fn()} step="any" />);

    const input = screen.getByLabelText("Temperature") as HTMLInputElement;
    expect(input.step).toBe("any");
  });

  it("displays placeholder text", () => {
    render(
      <NumberField
        label="Temperature"
        value={null}
        onChange={vi.fn()}
        placeholder="Enter temperature"
      />,
    );

    const input = screen.getByLabelText("Temperature");
    expect(input).toHaveAttribute("placeholder", "Enter temperature");
  });

  it("generates unique id from label", () => {
    render(<NumberField label="Outdoor Temperature" value={25} onChange={vi.fn()} />);

    const input = screen.getByLabelText("Outdoor Temperature");
    expect(input).toHaveAttribute("id", "number-field-outdoor-temperature");
  });

  it("handles labels with special characters in id generation", () => {
    render(<NumberField label="Temperature (°C)" value={25} onChange={vi.fn()} />);

    const input = screen.getByLabelText("Temperature (°C)");
    expect(input.id).toBe("number-field-temperature-(°c)");
  });

  it("handles zero value correctly", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<NumberField label="Temperature" value={null} onChange={handleChange} />);

    const input = screen.getByLabelText("Temperature");
    await user.type(input, "0");

    expect(handleChange).toHaveBeenCalledWith(0);
  });

  it("converts string input to number", () => {
    const handleChange = vi.fn();

    render(<NumberField label="Value" value={null} onChange={handleChange} />);

    const input = screen.getByLabelText("Value") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "123" } });

    expect(handleChange).toHaveBeenCalledWith(123);
    expect(typeof handleChange.mock.calls[0][0]).toBe("number");
  });
});
