import { useQuery } from "@tanstack/react-query";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useModelFamily } from "../hooks/useModelFamily";
import { familyPath } from "../lib/modelFamilies";
import { supabase } from "../lib/supabaseClient";

interface StatsCardProps {
  label: string;
  count?: number;
  isLoading: boolean;
  error?: Error | null;
  onClick?: () => void;
}

function StatsCard({ label, count, isLoading, error, onClick }: StatsCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  if (onClick) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: card component requires div for styling
      <div
        className="card stats-card clickable"
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <h3 className="stats-card-count">{isLoading ? "..." : error ? "-" : count}</h3>
        <div className="muted">{label}</div>
      </div>
    );
  }

  return (
    <div className="card stats-card">
      <h3 className="stats-card-count">{isLoading ? "..." : error ? "-" : count}</h3>
      <div className="muted">{label}</div>
    </div>
  );
}

export default function Home() {
  const { family } = useModelFamily();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const statsQ = useQuery({
    queryKey: ["homeStats", family],
    queryFn: async () => {
      const [systems, measurements, monthly] = await Promise.all([
        supabase
          .from("heating_systems")
          .select("heating_id", { count: "exact", head: true })
          .eq("model_family_id", family),
        supabase
          .from("measurements")
          .select("id,heating_systems!inner(model_family_id)", { count: "exact", head: true })
          .eq("heating_systems.model_family_id", family),
        supabase
          .from("monthly_values")
          .select("id,heating_systems!inner(model_family_id)", { count: "exact", head: true })
          .eq("heating_systems.model_family_id", family),
      ]);

      for (const result of [systems, measurements, monthly]) {
        if (result.error) throw result.error;
      }
      return {
        systems: systems.count ?? 0,
        measurements: measurements.count ?? 0,
        monthly: monthly.count ?? 0,
      };
    },
  });

  return (
    <div className="home-container">
      <section className="home-intro">
        <h1>{t("home.title")}</h1>
        <p>{t("home.intro")}</p>
      </section>

      <section className="home-stats-grid">
        <StatsCard
          label={t("home.stats.systems")}
          count={statsQ.data?.systems}
          isLoading={statsQ.isLoading}
          onClick={() => navigate(familyPath("/systems", family))}
        />
        <StatsCard
          label={t("home.stats.monthly")}
          count={statsQ.data?.monthly}
          isLoading={statsQ.isLoading}
          onClick={() => navigate(familyPath("/monthly", family))}
        />
        <StatsCard
          label={t("home.stats.measurements")}
          count={statsQ.data?.measurements}
          isLoading={statsQ.isLoading}
          onClick={() => navigate(familyPath("/daily", family))}
        />
      </section>

      <div className="home-footer">
        <p className="muted">
          <Trans
            i18nKey="home.footer"
            components={[
              <a key="account" href={`/metrics/#${familyPath("/my-account", family)}`}>
                Account
              </a>,
              <a key="howto" href="/metrics/howto">
                How-to
              </a>,
            ]}
          />
        </p>
      </div>
    </div>
  );
}
