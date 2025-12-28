import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CopyField } from "../CopyField";

describe("CopyField", () => {
  // Mock navigator.clipboard
  const mockWriteText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
  });

  it("renders label and value", () => {
    render(<CopyField label="API Key" value="abc123xyz" />);

    expect(screen.getByLabelText("API Key")).toBeInTheDocument();
    expect(screen.getByDisplayValue("abc123xyz")).toBeInTheDocument();
  });

  it("renders input as read-only", () => {
    render(<CopyField label="Token" value="secret-token" />);

    const input = screen.getByLabelText("Token") as HTMLInputElement;
    expect(input.readOnly).toBe(true);
  });

  it("displays copy button with correct text", () => {
    render(<CopyField label="Code" value="12345" />);

    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
  });

  it("copies value to clipboard when button clicked", async () => {
    render(<CopyField label="API Key" value="test-value-123" />);

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith("test-value-123");
  });

  it("shows 'copied' message after successful copy", async () => {
    render(<CopyField label="Code" value="12345" />);

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();
    });
  });

  it("generates unique id from label", () => {
    render(<CopyField label="API Key" value="test" />);

    const input = screen.getByLabelText("API Key");
    expect(input).toHaveAttribute("id", "copy-field-api-key");
  });

  it("handles labels with special characters in id generation", () => {
    render(<CopyField label="API Key (Production)" value="test" />);

    const input = screen.getByLabelText("API Key (Production)");
    expect(input.id).toContain("copy-field-api-key-(production)");
  });

  it("handles empty string value", () => {
    render(<CopyField label="Empty" value="" />);

    const input = screen.getByLabelText("Empty") as HTMLInputElement;
    expect(input.value).toBe("");
  });
});
