import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MonthYearPicker } from "../MonthYearPicker";

describe.skip("MonthYearPicker", () => {
  let originalDate: DateConstructor;

  beforeEach(() => {
    // Save original Date
    originalDate = global.Date;

    // Mock Date to return a fixed date: January 15, 2025
    const mockDate = new Date(2025, 0, 15); // Month is 0-indexed
    const MockDateConstructor: any = (...args: any[]) => {
      if (args.length === 0) {
        return mockDate;
      }
      // @ts-expect-error - Mocking Date constructor with spread args
      return new originalDate(...args);
    };
    vi.spyOn(global, "Date").mockImplementation(MockDateConstructor);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders month and year selects", () => {
    render(<MonthYearPicker month={1} year={2025} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/month/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument();
  });

  it("displays selected month", () => {
    // Current date is mocked to January 2025, so only month 1 is available
    render(<MonthYearPicker month={1} year={2025} onChange={vi.fn()} />);

    const monthSelect = screen.getByLabelText(/month/i) as HTMLSelectElement;
    expect(monthSelect.value).toBe("1");
  });

  it("displays selected year", () => {
    render(<MonthYearPicker month={1} year={2025} onChange={vi.fn()} />);

    const yearSelect = screen.getByLabelText(/year/i) as HTMLSelectElement;
    expect(yearSelect.value).toBe("2025");
  });

  it("calls onChange with new month when month changes", () => {
    // Mock to June 2025 so we have multiple months to select
    vi.restoreAllMocks();
    const mockDate = new Date(2025, 5, 15); // June 2025
    const MockDateConstructor: any = (...args: any[]) => {
      if (args.length === 0) {
        return mockDate;
      }
      // @ts-expect-error - Mocking Date constructor with spread args
      return new originalDate(...args);
    };
    vi.spyOn(global, "Date").mockImplementation(MockDateConstructor);

    const handleChange = vi.fn();
    render(<MonthYearPicker month={1} year={2025} onChange={handleChange} />);

    const monthSelect = screen.getByLabelText(/month/i);
    fireEvent.change(monthSelect, { target: { value: "3" } });

    expect(handleChange).toHaveBeenCalledWith({ month: 3, year: 2025 });
  });

  it("calls onChange with new year when year changes", () => {
    const handleChange = vi.fn();
    render(<MonthYearPicker month={1} year={2025} onChange={handleChange} />);

    const yearSelect = screen.getByLabelText(/year/i);
    fireEvent.change(yearSelect, { target: { value: "2025" } });

    expect(handleChange).toHaveBeenCalledWith({ month: 1, year: 2025 });
  });

  it("generates years from 2025 to current year", () => {
    render(<MonthYearPicker month={1} year={2025} onChange={vi.fn()} />);

    const yearSelect = screen.getByLabelText(/year/i) as HTMLSelectElement;
    const years = Array.from(yearSelect.options).map((opt) => opt.value);

    expect(years).toContain("2025");
    expect(years[0]).toBe("2025");
  });

  it("shows only months up to current month for current year", () => {
    // Current date mocked to January 15, 2025 (month 1)
    render(<MonthYearPicker month={1} year={2025} onChange={vi.fn()} />);

    const monthSelect = screen.getByLabelText(/month/i) as HTMLSelectElement;
    const months = Array.from(monthSelect.options).map((opt) => opt.value);

    // Should only show month 1 (January) since we're mocked to January 2025
    expect(months).toEqual(["1"]);
  });

  it("shows all 12 months for past years", () => {
    // Mock to a future date so 2025 is in the past
    vi.restoreAllMocks();
    const futureDate = new Date(2026, 5, 15); // June 2026
    const MockDateConstructor: any = (...args: any[]) => {
      if (args.length === 0) {
        return futureDate;
      }
      // @ts-expect-error - Mocking Date constructor with spread args
      return new originalDate(...args);
    };
    vi.spyOn(global, "Date").mockImplementation(MockDateConstructor);

    render(<MonthYearPicker month={1} year={2025} onChange={vi.fn()} />);

    const monthSelect = screen.getByLabelText(/month/i) as HTMLSelectElement;
    expect(monthSelect.options).toHaveLength(12);
  });

  it("has correct id attributes for month and year selects", () => {
    render(<MonthYearPicker month={1} year={2025} onChange={vi.fn()} />);

    const monthSelect = screen.getByLabelText(/month/i);
    const yearSelect = screen.getByLabelText(/year/i);

    expect(monthSelect).toHaveAttribute("id", "month-picker");
    expect(yearSelect).toHaveAttribute("id", "year-picker");
  });

  it("renders month numbers as option labels", () => {
    // Mock to June 2025 so we have multiple months
    vi.restoreAllMocks();
    const mockDate = new Date(2025, 5, 15); // June 2025
    const MockDateConstructor: any = (...args: any[]) => {
      if (args.length === 0) {
        return mockDate;
      }
      // @ts-expect-error - Mocking Date constructor with spread args
      return new originalDate(...args);
    };
    vi.spyOn(global, "Date").mockImplementation(MockDateConstructor);

    render(<MonthYearPicker month={1} year={2025} onChange={vi.fn()} />);

    expect(screen.getByRole("option", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "3" })).toBeInTheDocument();
  });
});
