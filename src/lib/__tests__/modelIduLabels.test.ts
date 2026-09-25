import { describe, expect, it } from "vitest";
import i18n from "../../i18n";
import { MODEL_IDU_VALUES } from "../enumCatalog";

describe("indoor-unit labels", () => {
  it("explains every selectable model in German and English", () => {
    for (const language of ["de", "en"]) {
      for (const code of MODEL_IDU_VALUES) {
        const label = i18n.getResource(language, "translation", `models.model_idu.${code}`);
        expect(label, `${language}: ${code}`).toBeTypeOf("string");
        if (!/^(CS5800i|CS6800i|WLW176i|WLW186i_(?!MBE_PLUS))/.test(code)) {
          expect(label, `${language}: ${code}`).toContain("(");
        }
      }
    }
  });
});
