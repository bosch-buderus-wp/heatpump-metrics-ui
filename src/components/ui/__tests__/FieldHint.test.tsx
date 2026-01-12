import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FieldHint } from "../FieldHint";

describe("FieldHint", () => {
  it("should render info icon", () => {
    render(<FieldHint hint="This is a helpful hint" />);
    const button = screen.getByRole("button", { name: /show hint/i });
    expect(button).toBeInTheDocument();
  });

  it("should not show popover initially", () => {
    render(<FieldHint hint="This is a helpful hint" />);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("should show popover when icon is clicked", async () => {
    const user = userEvent.setup();
    render(<FieldHint hint="This is a helpful hint" />);

    const button = screen.getByRole("button", { name: /show hint/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      expect(screen.getByText("This is a helpful hint")).toBeInTheDocument();
    });
  });

  it("should hide popover when clicked again", async () => {
    const user = userEvent.setup();
    render(<FieldHint hint="This is a helpful hint" />);

    const button = screen.getByRole("button", { name: /show hint/i });

    // Open popover
    await user.click(button);
    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    // Close popover
    await user.click(button);
    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("should hide popover when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <FieldHint hint="This is a helpful hint" />
        <div data-testid="outside">Outside element</div>
      </div>,
    );

    const button = screen.getByRole("button", { name: /show hint/i });

    // Open popover
    await user.click(button);
    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    // Click outside
    const outside = screen.getByTestId("outside");
    await user.click(outside);

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("should close popover when Escape key is pressed", async () => {
    const user = userEvent.setup();
    render(<FieldHint hint="This is a helpful hint" />);

    const button = screen.getByRole("button", { name: /show hint/i });

    // Open popover
    await user.click(button);
    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    // Press Escape
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("should have aria-expanded attribute", async () => {
    const user = userEvent.setup();
    render(<FieldHint hint="This is a helpful hint" />);

    const button = screen.getByRole("button", { name: /show hint/i });

    // Initially collapsed
    expect(button).toHaveAttribute("aria-expanded", "false");

    // Open popover
    await user.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute("aria-expanded", "true");
    });
  });

  it("should render plain text without links", async () => {
    const user = userEvent.setup();
    render(<FieldHint hint="Plain text without any links" />);

    const button = screen.getByRole("button", { name: /show hint/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Plain text without any links")).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  it("should parse and render markdown-style links", async () => {
    const user = userEvent.setup();
    render(<FieldHint hint="Check out [this link](https://example.com) for more info" />);

    const button = screen.getByRole("button", { name: /show hint/i });
    await user.click(button);

    await waitFor(() => {
      const link = screen.getByRole("link", { name: "this link" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");

      // Check that text parts exist (they're split across elements)
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveTextContent("Check out");
      expect(tooltip).toHaveTextContent("this link");
      expect(tooltip).toHaveTextContent("for more info");
    });
  });

  it("should render multiple links in hint text", async () => {
    const user = userEvent.setup();
    render(<FieldHint hint="Visit [link one](https://one.com) and [link two](https://two.com)" />);

    const button = screen.getByRole("button", { name: /show hint/i });
    await user.click(button);

    await waitFor(() => {
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute("href", "https://one.com");
      expect(links[1]).toHaveAttribute("href", "https://two.com");
    });
  });

  it("should stop propagation when clicking on links", async () => {
    const user = userEvent.setup();
    render(<FieldHint hint="Click [this link](https://example.com) to open" />);

    const button = screen.getByRole("button", { name: /show hint/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    const link = screen.getByRole("link", { name: "this link" });

    // Click the link - popover should stay open (stopPropagation prevents close)
    await user.click(link);

    // Popover should still be visible
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });
});
