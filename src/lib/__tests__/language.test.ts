import { describe, expect, it } from "vitest";
import { languageFromPath } from "../language";

describe("languageFromPath", () => {
  it.each([
    ["/metrics/", "de"],
    ["/metrics/#/yearly", "de"],
    ["/en", "en"],
    ["/en/metrics/", "en"],
    ["/en/metrics/#/yearly", "en"],
  ] as const)("maps %s to %s", (pathname, expected) => {
    expect(languageFromPath(pathname)).toBe(expected);
  });
});
