import { describe, expect, it } from "vitest";
import i18n from "../../i18n";

describe("translations", () => {
  it.each(["de", "en"])("preserves intentionally empty login text in %s", (language) => {
    const t = i18n.getFixedT(language);
    expect(t("auth.acceptTerms2")).toBe("");
    expect(t("auth.acceptPrivacy2")).toBe("");
  });
});
