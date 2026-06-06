import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { navigate, takeRedirect } from "../lib/router";
import { VistaMark, ArrowLeft } from "./Icons";
import LangToggle from "./LangToggle";

export default function Auth({ mode = "login" }) {
  const { t } = useI18n();
  const { login, signup } = useAuth();
  const isSignup = mode === "signup";

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [touched, setTouched] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const invalid = {
    name: isSignup && !form.name.trim(),
    email: !form.email.trim(),
    password: !form.password.trim(),
  };

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (invalid.email || invalid.password || invalid.name) return;
    if (isSignup) signup({ name: form.name, email: form.email });
    else login({ email: form.email });
    navigate(takeRedirect() || "/app");
  };

  return (
    <div className="auth-wrap">
      {/* Brand panel */}
      <aside className="auth-brand">
        <a href="#/" style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff", textDecoration: "none" }}>
          <VistaMark />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Vista
          </span>
        </a>

        <div style={{ marginTop: "auto" }}>
          <h2 className="display-md" style={{ color: "#fff", marginBottom: "var(--s-sm)" }}>
            {t("auth.brand.title")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, lineHeight: 1.6, maxWidth: 360 }}>
            {t("auth.brand.body")}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: "var(--s-xl)" }}>
          <span style={{ width: 28, height: 6, borderRadius: 3, background: "var(--sig-peach)" }} />
          <span style={{ width: 18, height: 6, borderRadius: 3, background: "var(--sig-mint)" }} />
          <span style={{ width: 12, height: 6, borderRadius: 3, background: "var(--sig-yellow)" }} />
        </div>
      </aside>

      {/* Form panel */}
      <main className="auth-form">
        <div style={{ position: "absolute", top: "var(--s-lg)", right: "var(--s-lg)" }}>
          <LangToggle />
        </div>

        <div style={{ width: "100%", maxWidth: 380 }}>
          <a href="#/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)" }}>
            <ArrowLeft size={14} /> {t("auth.back")}
          </a>

          <h1 className="display-md" style={{ marginTop: "var(--s-md)", marginBottom: 6 }}>
            {isSignup ? t("auth.signup.title") : t("auth.login.title")}
          </h1>
          <p style={{ color: "var(--muted)", marginBottom: "var(--s-lg)" }}>
            {isSignup ? t("auth.signup.subtitle") : t("auth.login.subtitle")}
          </p>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--s-md)" }}>
            {isSignup && (
              <Field
                label={t("auth.name")}
                value={form.name}
                onChange={set("name")}
                placeholder={t("auth.namePlaceholder")}
                invalid={touched && invalid.name}
                err={t("auth.required")}
                autoFocus
              />
            )}
            <Field
              label={t("auth.email")}
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder={t("auth.emailPlaceholder")}
              invalid={touched && invalid.email}
              err={t("auth.required")}
              autoFocus={!isSignup}
            />
            <Field
              label={t("auth.password")}
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder={t("auth.passwordPlaceholder")}
              invalid={touched && invalid.password}
              err={t("auth.required")}
            />

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "var(--s-xs)" }}>
              {isSignup ? t("auth.signup.submit") : t("auth.login.submit")}
            </button>
          </form>

          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: "var(--s-lg)", textAlign: "center" }}>
            {isSignup ? t("auth.toLogin") : t("auth.toSignup")}{" "}
            <a
              href={isSignup ? "#/login" : "#/signup"}
              style={{ fontWeight: 500 }}
            >
              {isSignup ? t("auth.toLoginLink") : t("auth.toSignupLink")}
            </a>
          </p>

          <div
            style={{
              marginTop: "var(--s-lg)",
              fontSize: 12,
              color: "var(--border-strong)",
              textAlign: "center",
              padding: "8px 12px",
              border: "1px dashed var(--hairline)",
              borderRadius: "var(--r-sm)",
            }}
          >
            {t("auth.demoNote")}
          </div>
        </div>
      </main>

      <style>{`
        .auth-wrap {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .auth-brand {
          background: var(--surface-dark);
          color: #fff;
          padding: var(--s-xxl);
          display: flex;
          flex-direction: column;
        }
        .auth-form {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--s-xxl) var(--s-lg);
          background: var(--canvas);
        }
        @media (max-width: 820px) {
          .auth-wrap { grid-template-columns: 1fr; }
          .auth-brand { display: none; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", invalid, err, autoFocus }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        className="input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={invalid ? { borderColor: "var(--sig-coral)" } : undefined}
      />
      {invalid && (
        <span style={{ color: "var(--sig-coral)", fontSize: 12, marginTop: 4, display: "block" }}>{err}</span>
      )}
    </div>
  );
}
