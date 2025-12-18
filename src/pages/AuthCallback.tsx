import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useTranslation } from "react-i18next";

export default function AuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyOtp = async () => {
      try {
        // Get the token_hash and type from URL params
        const token_hash = searchParams.get("token_hash");
        const type = searchParams.get("type");

        if (!token_hash) {
          setError(`Invalid authentication link: ${token_hash} ${type}`);
          setLoading(false);
          return;
        }

        // Verify the OTP token
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as "email",
        });

        if (verifyError) throw verifyError;

        // Successfully authenticated, redirect to home/dashboard
        navigate("/", { replace: true });
      } catch (err) {
        console.error("Auth callback error:", err);
        const message = err instanceof Error ? err.message : "Authentication failed";
        setError(message);
        setLoading(false);
      }
    };

    verifyOtp();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <section className="auth">
        <h2>{t("auth.verifying")}</h2>
        <p className="info">{t("common.loading")}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="auth">
        <h2>{t("auth.authenticationFailed")}</h2>
        <div className="error">{error}</div>
        <button className="btn" type="button" onClick={() => navigate("/login", { replace: true })}>
          {t("auth.backToLogin")}
        </button>
      </section>
    );
  }

  return null;
}
