import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface PageLayoutProps {
  titleKey: string;
  infoKey: string;
  filters?: ReactNode;
  chart?: ReactNode;
  children: ReactNode;
  error?: Error | null;
  isLoading?: boolean;
}

export function PageLayout({
  titleKey,
  infoKey,
  filters,
  chart,
  children,
  error,
  isLoading = false,
}: PageLayoutProps) {
  const { t } = useTranslation();

  return (
    <section>
      <h2>{t(titleKey)}</h2>
      <p className="muted">{t(infoKey)}</p>

      {filters && <div className="filters">{filters}</div>}

      {chart}

      {isLoading && <div>{t("common.loading")}</div>}
      {error && <div className="error">{error.message}</div>}

      {children}
    </section>
  );
}
