import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const AUTH_METHOD = window.VITE_AUTH_METHOD || import.meta.env.VITE_AUTH_METHOD || "magic-link";
const AUTH_CALLBACK_URL = window.VITE_AUTH_CALLBACK_URL || import.meta.env.VITE_AUTH_CALLBACK_URL;

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Consent checkboxes
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptPublicData, setAcceptPublicData] = useState(false);

  const useMagicLink = AUTH_METHOD === "magic-link";
  const canSubmit = acceptTerms && acceptPrivacy && acceptPublicData;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMagicLinkSent(false);
    setLoading(true);

    try {
      if (useMagicLink) {
        // Magic link authentication
        const { error: authError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: AUTH_CALLBACK_URL,
          },
        });
        if (authError) throw authError;
        setMagicLinkSent(true);
      } else {
        // Password-based authentication
        if (mode === "signin") {
          const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
          if (authError) throw authError;
        } else {
          const { error: authError } = await supabase.auth.signUp({ email, password });
          if (authError) throw authError;
        }
        navigate("/my-account");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Magic link success view
  if (magicLinkSent) {
    return (
      <section className="auth">
        <h2>{t("auth.magicLinkSent")}</h2>
        <p className="info">{t("auth.checkEmail")}</p>
        <button className="btn link" type="button" onClick={() => setMagicLinkSent(false)}>
          {t("auth.tryAgain")}
        </button>
      </section>
    );
  }

  return (
    <section className="auth">
      <h2>
        {useMagicLink
          ? t("auth.signInMagicLink")
          : mode === "signin"
            ? t("auth.signIn")
            : t("auth.signUp")}
      </h2>
      {useMagicLink && <p className="info">{t("auth.magicLinkInfo")}</p>}
      <form onSubmit={onSubmit} className="form">
        <label>
          {t("auth.email")}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {!useMagicLink && (
          <label>
            {t("auth.password")}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        )}

        {/* Consent Checkboxes */}
        <div className="consent-section">
          <label className="consent-label">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="consent-checkbox"
            />
            <span className="consent-text">
              {t("auth.acceptTerms1")}{" "}
              <Link to="/terms" target="_blank" className="consent-link">
                {t("legal.terms")}
              </Link>{" "}
              {t("auth.acceptTerms2")}
            </span>
          </label>

          <label className="consent-label">
            <input
              type="checkbox"
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
              className="consent-checkbox"
            />
            <span className="consent-text">
              {t("auth.acceptPrivacy1")}{" "}
              <Link to="/privacy" target="_blank" className="consent-link">
                {t("legal.privacy")}
              </Link>{" "}
              {t("auth.acceptPrivacy2")}
            </span>
          </label>

          <label className="consent-label">
            <input
              type="checkbox"
              checked={acceptPublicData}
              onChange={(e) => setAcceptPublicData(e.target.checked)}
              className="consent-checkbox"
            />
            <span className="consent-text-bold">{t("auth.acceptPublicData")}</span>
          </label>
        </div>

        {error && <div className="error">{error}</div>}
        <button className="btn" type="submit" disabled={loading || !canSubmit}>
          {loading
            ? t("common.loading")
            : useMagicLink
              ? t("auth.sendMagicLink")
              : mode === "signin"
                ? t("auth.signIn")
                : t("auth.signUp")}
        </button>
        {!useMagicLink && (
          <div className="switch">
            <button
              className="link"
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {t("auth.or")} {mode === "signin" ? t("auth.signUp") : t("auth.signIn")}
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
