import { describe, expect, it } from "vitest";
import { formatDate } from "../dateFormatting";

describe("formatDate", () => {
  it("formats calendar dates in the selected language without changing the day", () => {
    expect(formatDate("2026-01-02", "de")).toBe("02.01.2026");
    expect(formatDate("2026-01-02", "en")).toBe("01/02/2026");
    expect(formatDate("2026-01-02", "de", { day: "2-digit" })).toBe("02");
  });

  it("formats timestamps in the requested time zone, including daylight saving", () => {
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Berlin",
    };
    expect(formatDate("2026-07-01T22:30:00Z", "de", options)).toBe("02.07.2026, 00:30");
  });

  it("returns an invalid input without throwing", () => {
    expect(formatDate("invalid", "de")).toBe("invalid");
  });
});
