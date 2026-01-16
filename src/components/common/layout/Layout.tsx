import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";

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
      <div className="app-container">
        {!isEmbedded && (
          <header className="app-header">
            <Link to="/" className="brand">
              {t("appTitle")}
            </Link>
            <nav className="nav">
              <NavLink to="/" end>
                {t("nav.home")}
              </NavLink>
              <NavLink to="/yearly">{t("nav.yearly")}</NavLink>
              <NavLink to="/monthly">{t("nav.monthly")}</NavLink>
              <NavLink to="/daily">{t("nav.daily")}</NavLink>
              <NavLink to="/measurements">{t("nav.measurements")}</NavLink>
              <NavLink to="/systems">{t("nav.systems")}</NavLink>
              <NavLink to="/az-temp-evaluation">{t("nav.azTempEvaluation")}</NavLink>
              <NavLink to="/my-account">{t("nav.myAccount")}</NavLink>
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
                <NavLink to="/login" className="btn">
                  {t("nav.login")}
                </NavLink>
              )}
            </div>
          </header>
        )}
        <main className="app-main">{children}</main>
        <footer className="app-footer">
          <span>© {new Date().getFullYear()} Heatpump Metrics</span>
          <span className="footer-separator">|</span>
          <Link to="/terms">{t("legal.terms")}</Link>
          <span className="footer-separator">|</span>
          <Link to="/privacy">{t("legal.privacy")}</Link>
        </footer>
      </div>
    </SessionContext.Provider>
  );
}
