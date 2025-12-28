import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "../ConfirmDialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    title: "Confirm Action",
    message: "Are you sure?",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it("renders when open is true", () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);

    expect(screen.queryByText("Confirm Action")).not.toBeInTheDocument();
  });

  it("shows title correctly", () => {
    render(<ConfirmDialog {...defaultProps} title="Delete Item" />);

    expect(screen.getByText("Delete Item")).toBeInTheDocument();
  });

  it("shows message correctly", () => {
    render(<ConfirmDialog {...defaultProps} message="This action cannot be undone." />);

    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    const handleConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={handleConfirm} />);

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    fireEvent.click(confirmButton);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", () => {
    const handleCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={handleCancel} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it("shows loading state on buttons when isLoading is true", () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />);

    const confirmButton = screen.getByRole("button", { name: /loading/i });
    const cancelButton = screen.getByRole("button", { name: /cancel/i });

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it("does not disable buttons when isLoading is false", () => {
    render(<ConfirmDialog {...defaultProps} isLoading={false} />);

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    const cancelButton = screen.getByRole("button", { name: /cancel/i });

    expect(confirmButton).not.toBeDisabled();
    expect(cancelButton).not.toBeDisabled();
  });

  it("handles multiline messages with line breaks", () => {
    const multilineMessage = "Line 1\nLine 2\nLine 3";
    render(<ConfirmDialog {...defaultProps} message={multilineMessage} />);

    // Check that the message is rendered (using text matcher for multi-element text)
    expect(
      screen.getByText((_content, element) => {
        return element?.textContent === multilineMessage;
      }),
    ).toBeInTheDocument();
  });

  it("renders both action buttons", () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("does not call handlers when dialog is closed", () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <ConfirmDialog
        {...defaultProps}
        open={false}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />,
    );

    // Dialog is not visible, so buttons don't exist and can't be clicked
    expect(screen.queryByRole("button", { name: /confirm/i })).not.toBeInTheDocument();
    expect(handleConfirm).not.toHaveBeenCalled();
    expect(handleCancel).not.toHaveBeenCalled();
  });
});
