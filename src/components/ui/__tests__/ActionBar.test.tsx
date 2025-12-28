import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionBar, type ActionButton } from "../ActionBar";

describe("ActionBar", () => {
  const mockActions: ActionButton[] = [
    { label: "Save", onClick: vi.fn(), variant: "primary" },
    { label: "Cancel", onClick: vi.fn(), variant: "secondary" },
  ];

  it("renders all action buttons", () => {
    render(<ActionBar actions={mockActions} />);

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("calls onClick when button is clicked", () => {
    const handleClick = vi.fn();
    const actions: ActionButton[] = [{ label: "Submit", onClick: handleClick }];

    render(<ActionBar actions={actions} />);

    const button = screen.getByRole("button", { name: "Submit" });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders disabled button when disabled prop is true", () => {
    const actions: ActionButton[] = [{ label: "Delete", onClick: vi.fn(), disabled: true }];

    render(<ActionBar actions={actions} />);

    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toBeDisabled();
  });

  it("renders enabled button when disabled prop is false", () => {
    const actions: ActionButton[] = [{ label: "Edit", onClick: vi.fn(), disabled: false }];

    render(<ActionBar actions={actions} />);

    const button = screen.getByRole("button", { name: "Edit" });
    expect(button).not.toBeDisabled();
  });

  it("applies correct CSS class based on variant", () => {
    const actions: ActionButton[] = [
      { label: "Primary", onClick: vi.fn(), variant: "primary" },
      { label: "Secondary", onClick: vi.fn(), variant: "secondary" },
      { label: "Danger", onClick: vi.fn(), variant: "danger" },
    ];

    render(<ActionBar actions={actions} />);

    const primaryBtn = screen.getByRole("button", { name: "Primary" });
    const secondaryBtn = screen.getByRole("button", { name: "Secondary" });
    const dangerBtn = screen.getByRole("button", { name: "Danger" });

    expect(primaryBtn).toHaveClass("action-btn-primary");
    expect(secondaryBtn).toHaveClass("action-btn-secondary");
    expect(dangerBtn).toHaveClass("action-btn-danger");
  });

  it("uses primary variant by default when variant not specified", () => {
    const actions: ActionButton[] = [{ label: "Default", onClick: vi.fn() }];

    render(<ActionBar actions={actions} />);

    const button = screen.getByRole("button", { name: "Default" });
    expect(button).toHaveClass("action-btn-primary");
  });

  it("displays success feedback message", () => {
    const feedback = { type: "success" as const, message: "Action completed successfully!" };

    render(<ActionBar actions={mockActions} feedback={feedback} />);

    expect(screen.getByText("Action completed successfully!")).toBeInTheDocument();
  });

  it("displays error feedback message", () => {
    const feedback = { type: "error" as const, message: "Action failed. Please try again." };

    render(<ActionBar actions={mockActions} feedback={feedback} />);

    expect(screen.getByText("Action failed. Please try again.")).toBeInTheDocument();
  });

  it("does not display feedback when feedback is null", () => {
    render(<ActionBar actions={mockActions} feedback={null} />);

    // No feedback message should be present
    expect(screen.queryByText(/completed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
  });

  it("renders empty action bar when no actions provided", () => {
    render(<ActionBar actions={[]} />);

    const buttons = screen.queryAllByRole("button");
    expect(buttons).toHaveLength(0);
  });

  it("renders icon when icon prop is provided", () => {
    const actions: ActionButton[] = [{ label: "Save", onClick: vi.fn(), icon: "💾" }];

    render(<ActionBar actions={actions} />);

    expect(screen.getByText("💾")).toBeInTheDocument();
  });

  it("renders button without icon when icon not provided", () => {
    const actions: ActionButton[] = [{ label: "Save", onClick: vi.fn() }];

    render(<ActionBar actions={actions} />);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button.textContent).toBe("Save");
  });

  it("calls correct onClick handler for each button", () => {
    const onClick1 = vi.fn();
    const onClick2 = vi.fn();
    const actions: ActionButton[] = [
      { label: "Button 1", onClick: onClick1 },
      { label: "Button 2", onClick: onClick2 },
    ];

    render(<ActionBar actions={actions} />);

    fireEvent.click(screen.getByRole("button", { name: "Button 1" }));
    expect(onClick1).toHaveBeenCalledTimes(1);
    expect(onClick2).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Button 2" }));
    expect(onClick2).toHaveBeenCalledTimes(1);
    expect(onClick1).toHaveBeenCalledTimes(1);
  });
});
