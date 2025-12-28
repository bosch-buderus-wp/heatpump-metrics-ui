import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TextField } from "../TextField";

describe("TextField", () => {
  it("renders with label and value", () => {
    render(<TextField label="Name" value="John Doe" onChange={vi.fn()} />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("John Doe");
  });

  it("renders with null value as empty", () => {
    render(<TextField label="Name" value={null} onChange={vi.fn()} />);

    const input = screen.getByLabelText("Name");
    expect(input).toHaveValue("");
  });

  it("renders with undefined value as empty", () => {
    render(<TextField label="Name" value={undefined} onChange={vi.fn()} />);

    const input = screen.getByLabelText("Name");
    expect(input).toHaveValue("");
  });

  it("calls onChange with string when user types", () => {
    const handleChange = vi.fn();
    render(<TextField label="Name" value="" onChange={handleChange} />);

    const input = screen.getByLabelText("Name");
    fireEvent.change(input, { target: { value: "Alice" } });

    expect(handleChange).toHaveBeenCalledWith("Alice");
  });

  it("calls onChange with null when input is cleared", () => {
    const handleChange = vi.fn();
    render(<TextField label="Name" value="John" onChange={handleChange} />);

    const input = screen.getByLabelText("Name");
    fireEvent.change(input, { target: { value: "" } });

    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it("displays placeholder text", () => {
    render(
      <TextField label="Name" value={null} onChange={vi.fn()} placeholder="Enter your name" />,
    );

    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("placeholder", "Enter your name");
  });

  it("generates unique id from label", () => {
    render(<TextField label="Full Name" value="" onChange={vi.fn()} />);

    const input = screen.getByLabelText("Full Name");
    expect(input).toHaveAttribute("id", "text-field-full-name");
  });

  it("handles labels with special characters in id generation", () => {
    render(<TextField label="Name (Optional)" value="" onChange={vi.fn()} />);

    const input = screen.getByLabelText("Name (Optional)");
    expect(input.id).toContain("text-field-name");
  });

  it("marks field as required when required prop is true", () => {
    render(<TextField label="Name" value="" onChange={vi.fn()} required />);

    const input = screen.getByLabelText("Name");
    expect(input).toBeRequired();
  });

  it("handles empty string value", () => {
    const handleChange = vi.fn();
    render(<TextField label="Name" value="" onChange={handleChange} />);

    const input = screen.getByLabelText("Name");
    expect(input).toHaveValue("");
  });

  it("handles whitespace in values", () => {
    const handleChange = vi.fn();
    render(<TextField label="Name" value="  John  " onChange={handleChange} />);

    const input = screen.getByLabelText("Name");
    expect(input).toHaveValue("  John  ");
  });
});
