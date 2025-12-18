import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useTranslation, Trans } from "react-i18next";

interface StatsCardProps {
  label: string;
  count?: number;
  isLoading: boolean;
  error?: Error | null;
}

function StatsCard({ label, count, isLoading, error }: StatsCardProps) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
      <h3 style={{ margin: 0, fontSize: "2.5rem", fontWeight: "bold" }}>
        {isLoading ? "..." : error ? "-" : count}
      </h3>
      <div className="muted">{label}</div>
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();

  const statsQ = useQuery({
    queryKey: ["homeStats"],
    queryFn: async () => {
      const [systems, measurements, monthly] = await Promise.all([
        supabase.from("heating_systems").select("heating_id", { count: "exact", head: true }),
        supabase.from("measurements").select("id", { count: "exact", head: true }),
        supabase.from("monthly_values").select("id", { count: "exact", head: true }),
      ]);

      return {
        systems: systems.count ?? 0,
        measurements: measurements.count ?? 0,
        monthly: monthly.count ?? 0,
      };
    },
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: "2rem" }}>
      <section style={{ textAlign: "center" }}>
        <h1>{t("home.title")}</h1>
        <p style={{ fontSize: "1.2rem", lineHeight: 1.6 }}>{t("home.intro")}</p>
      </section>

      <section
        className="grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        <StatsCard
          label={t("home.stats.systems")}
          count={statsQ.data?.systems}
          isLoading={statsQ.isLoading}
        />
        <StatsCard
          label={t("home.stats.monthly")}
          count={statsQ.data?.monthly}
          isLoading={statsQ.isLoading}
        />
        <StatsCard
          label={t("home.stats.measurements")}
          count={statsQ.data?.measurements}
          isLoading={statsQ.isLoading}
        />
      </section>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <p className="muted">
          <Trans
            i18nKey="home.footer"
            components={[
              <a key="account" href="/metrics/#/my-account">
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
