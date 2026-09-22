import { useTranslation } from "react-i18next";
import { useModelCatalog } from "../../../hooks/useModelCatalog";
import { useModelFamily } from "../../../hooks/useModelFamily";
import { FieldHint } from "../../ui/FieldHint";
export function ModelFamilySelector() {
  const { t } = useTranslation();
  const { family, setFamily } = useModelFamily();
  const { data, isLoading, error } = useModelCatalog();
  return (
    <section className="model-family-selector" aria-label={t("modelFamily.label")}>
      <div className="model-family-choice">
        <div className="flex-center-gap-sm">
          <label htmlFor="public-model-family">{t("modelFamily.label")}</label>
          <FieldHint hint={t("modelFamily.hint")} />
        </div>
        <select
          id="public-model-family"
          value={family}
          onChange={(event) => setFamily(event.target.value)}
          disabled={!data}
        >
          {data?.families.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      {isLoading && <span>{t("common.loading")}</span>}
      {error && <p role="alert">{t("modelFamily.catalogError")}</p>}
    </section>
  );
}
