import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useModelFamily } from "../../../hooks/useModelFamily";
import { SystemConsumptionModeProvider } from "../../../hooks/useSystemConsumptionMode";
import { familyPath } from "../../../lib/modelFamilies";
import { supabase } from "../../../lib/supabaseClient";
import { ModelFamilySelector } from "./ModelFamilySelector";

interface SessionContextType {
  session: Session | null;
}

const SessionContext = createContext<SessionContextType>({ session: null });

export function useSession() {
  return useContext(SessionContext);
}

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { family } = useModelFamily();
  const { pathname } = useLocation();
  const isPublic = !["/my-account", "/login", "/auth/callback", "/privacy", "/terms"].includes(
    pathname,
  );
  const { t, i18n } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };
    fetchSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  const isEmbedded =
    window.HEAT_PUMP_METRICS_EMBEDDED === true ||
    new URLSearchParams(window.location.search).get("embedded") === "true";

  return (
    <SessionContext.Provider value={{ session }}>
      <SystemConsumptionModeProvider key={family}>
        <div className="app-container">
          {!isEmbedded && (
            <header className="app-header">
              <Link to={familyPath("/", family)} className="brand">
                {t("appTitle")}
              </Link>
              <nav className="nav">
                <NavLink to={familyPath("/", family)} end>
                  {t("nav.home")}
                </NavLink>
                <NavLink to={familyPath("/yearly", family)}>{t("nav.yearly")}</NavLink>
                <NavLink to={familyPath("/building-comparison", family)}>
                  {t("nav.buildingComparison")}
                </NavLink>
                <NavLink to={familyPath("/monthly", family)}>{t("nav.monthly")}</NavLink>
                <NavLink to={familyPath("/daily", family)}>{t("nav.daily")}</NavLink>
                <NavLink to={familyPath("/measurements", family)}>{t("nav.measurements")}</NavLink>
                <NavLink to={familyPath("/systems", family)}>{t("nav.systems")}</NavLink>
                <NavLink to={familyPath("/az-temp-evaluation", family)}>
                  {t("nav.azTempEvaluation")}
                </NavLink>
                <NavLink to={familyPath("/az-energy-evaluation", family)}>
                  {t("nav.azEnergyEvaluation")}
                </NavLink>
                <NavLink to={familyPath("/heating-curve", family)}>{t("nav.heatingCurve")}</NavLink>
                <NavLink to={familyPath("/my-account", family)}>{t("nav.myAccount")}</NavLink>
              </nav>
              <div className="actions">
                <select
                  aria-label="Language"
                  value={i18n.language}
                  onChange={(e) => i18n.changeLanguage(e.target.value)}
                >
                  <option value="de">DE</option>
                  <option value="en">EN</option>
                </select>
                {session ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={async () => {
                      await supabase.auth.signOut();
                    }}
                  >
                    {t("nav.logout")}
                  </button>
                ) : (
                  <NavLink to={familyPath("/login", family)} className="btn">
                    {t("nav.login")}
                  </NavLink>
                )}
              </div>
            </header>
          )}
          <main className="app-main">
            {isPublic && <ModelFamilySelector />}
            {children}
          </main>
          <footer className="app-footer">
            <span>© {new Date().getFullYear()} Heatpump Metrics</span>
            <span className="footer-separator">|</span>
            <Link to={familyPath("/terms", family)}>{t("legal.terms")}</Link>
            <span className="footer-separator">|</span>
            <Link to={familyPath("/privacy", family)}>{t("legal.privacy")}</Link>
          </footer>
        </div>
      </SystemConsumptionModeProvider>
    </SessionContext.Provider>
  );
}
