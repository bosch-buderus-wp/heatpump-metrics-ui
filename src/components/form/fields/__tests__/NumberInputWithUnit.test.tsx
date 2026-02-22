import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NumberInputWithUnit } from "../NumberInputWithUnit";

describe("NumberInputWithUnit", () => {
  it("renders with value and unit", () => {
    render(<NumberInputWithUnit value={25} onChange={vi.fn()} unit="kWh" />);

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveValue(25);
    expect(screen.getByText("kWh")).toBeInTheDocument();
  });

  it("renders with null value as empty", () => {
    render(<NumberInputWithUnit value={null} onChange={vi.fn()} unit="°C" />);

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveValue(null);
  });

  it("renders with undefined value as empty", () => {
    render(<NumberInputWithUnit value={undefined} onChange={vi.fn()} unit="°C" />);

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveValue(null);
  });

  it("calls onChange with number when value changes", () => {
    const handleChange = vi.fn();
    render(<NumberInputWithUnit value={null} onChange={handleChange} unit="kWh" />);

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "42" } });

    expect(handleChange).toHaveBeenCalledWith(42);
  });

  it("calls onChange with null when input is cleared", () => {
    const handleChange = vi.fn();
    render(<NumberInputWithUnit value={25} onChange={handleChange} unit="kWh" />);

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "" } });

    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it("displays the unit label", () => {
    render(<NumberInputWithUnit value={100} onChange={vi.fn()} unit="km/h" />);

    expect(screen.getByText("km/h")).toBeInTheDocument();
  });

  it("applies min attribute", () => {
    render(<NumberInputWithUnit value={10} onChange={vi.fn()} unit="°C" min={0} />);

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.min).toBe("0");
  });

  it("applies max attribute", () => {
    render(<NumberInputWithUnit value={50} onChange={vi.fn()} unit="°C" max={100} />);

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.max).toBe("100");
  });

  it("applies step attribute with default 'any'", () => {
    render(<NumberInputWithUnit value={5} onChange={vi.fn()} unit="kWh" />);

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.step).toBe("any");
  });

  it("applies custom step attribute", () => {
    render(<NumberInputWithUnit value={5} onChange={vi.fn()} unit="kWh" step={0.1} />);

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.step).toBe("0.1");
  });

  it("applies placeholder text", () => {
    render(
      <NumberInputWithUnit value={null} onChange={vi.fn()} unit="kWh" placeholder="Enter value" />,
    );

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("placeholder", "Enter value");
  });

  it("disables input when disabled prop is true", () => {
    render(<NumberInputWithUnit value={10} onChange={vi.fn()} unit="kWh" disabled />);

    const input = screen.getByRole("spinbutton");
    expect(input).toBeDisabled();
  });

  it("enables input when disabled prop is false", () => {
    render(<NumberInputWithUnit value={10} onChange={vi.fn()} unit="kWh" disabled={false} />);

    const input = screen.getByRole("spinbutton");
    expect(input).not.toBeDisabled();
  });

  it("applies id attribute", () => {
    render(<NumberInputWithUnit value={10} onChange={vi.fn()} unit="kWh" id="custom-id" />);

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("id", "custom-id");
  });

  it("handles negative numbers", () => {
    const handleChange = vi.fn();
    render(<NumberInputWithUnit value={null} onChange={handleChange} unit="°C" />);

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "-10" } });

    expect(handleChange).toHaveBeenCalledWith(-10);
  });

  it("handles decimal numbers", () => {
    const handleChange = vi.fn();
    render(<NumberInputWithUnit value={null} onChange={handleChange} unit="kWh" />);

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "3.5" } });

    expect(handleChange).toHaveBeenCalledWith(3.5);
  });

  it("rounds displayed value when displayDecimals is provided", () => {
    render(<NumberInputWithUnit value={3.46} onChange={vi.fn()} unit="kWh" displayDecimals={1} />);

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveValue(3.5);
  });

  it("does not change onChange parsing when displayDecimals is provided", () => {
    const handleChange = vi.fn();
    render(
      <NumberInputWithUnit value={3.46} onChange={handleChange} unit="kWh" displayDecimals={1} />,
    );

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "3.44" } });

    expect(handleChange).toHaveBeenCalledWith(3.44);
  });
});
