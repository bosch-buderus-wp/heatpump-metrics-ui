import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TextAreaField } from "../TextAreaField";

describe("TextAreaField", () => {
  it("renders with label and value", () => {
    render(<TextAreaField label="Description" value="Some text" onChange={vi.fn()} />);

    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toHaveValue("Some text");
  });

  it("renders with null value as empty", () => {
    render(<TextAreaField label="Description" value={null} onChange={vi.fn()} />);

    const textarea = screen.getByLabelText("Description");
    expect(textarea).toHaveValue("");
  });

  it("renders with undefined value as empty", () => {
    render(<TextAreaField label="Description" value={undefined} onChange={vi.fn()} />);

    const textarea = screen.getByLabelText("Description");
    expect(textarea).toHaveValue("");
  });

  it("calls onChange with string when user types", () => {
    const handleChange = vi.fn();
    render(<TextAreaField label="Description" value="" onChange={handleChange} />);

    const textarea = screen.getByLabelText("Description");
    fireEvent.change(textarea, { target: { value: "New text" } });

    expect(handleChange).toHaveBeenCalledWith("New text");
  });

  it("calls onChange with null when textarea is cleared", () => {
    const handleChange = vi.fn();
    render(<TextAreaField label="Description" value="Some text" onChange={handleChange} />);

    const textarea = screen.getByLabelText("Description");
    fireEvent.change(textarea, { target: { value: "" } });

    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it("displays placeholder text", () => {
    render(
      <TextAreaField
        label="Description"
        value={null}
        onChange={vi.fn()}
        placeholder="Enter description"
      />,
    );

    const textarea = screen.getByLabelText("Description");
    expect(textarea).toHaveAttribute("placeholder", "Enter description");
  });

  it("applies rows attribute", () => {
    render(<TextAreaField label="Description" value="" onChange={vi.fn()} rows={5} />);

    const textarea = screen.getByLabelText("Description");
    expect(textarea).toHaveAttribute("rows", "5");
  });

  it("uses default of 3 rows when rows not specified", () => {
    render(<TextAreaField label="Description" value="" onChange={vi.fn()} />);

    const textarea = screen.getByLabelText("Description");
    expect(textarea).toHaveAttribute("rows", "3");
  });

  it("generates unique id from label", () => {
    render(<TextAreaField label="Long Description" value="" onChange={vi.fn()} />);

    const textarea = screen.getByLabelText("Long Description");
    expect(textarea).toHaveAttribute("id", "textarea-field-long-description");
  });

  it("handles custom rows attribute", () => {
    render(<TextAreaField label="Description" value="" onChange={vi.fn()} rows={10} />);

    const textarea = screen.getByLabelText("Description");
    expect(textarea).toHaveAttribute("rows", "10");
  });

  it("handles multiline text correctly", () => {
    const multilineText = "Line 1\nLine 2\nLine 3";
    render(<TextAreaField label="Description" value={multilineText} onChange={vi.fn()} />);

    const textarea = screen.getByLabelText("Description");
    expect(textarea).toHaveValue(multilineText);
  });

  it("preserves whitespace in values", () => {
    const textWithWhitespace = "  Indented text  \n  More text  ";
    render(<TextAreaField label="Description" value={textWithWhitespace} onChange={vi.fn()} />);

    const textarea = screen.getByLabelText("Description");
    expect(textarea).toHaveValue(textWithWhitespace);
  });
});
