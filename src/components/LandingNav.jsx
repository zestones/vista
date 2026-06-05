import { useI18n } from "../lib/i18n";
import { VISTA_GITHUB } from "../lib/github";
import { navigate } from "../lib/router";
import { VistaMark, GitHubIcon } from "./Icons";
import LangToggle from "./LangToggle";

export default function LandingNav() {
  const { t } = useI18n();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "saturate(180%) blur(10px)",
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      <div
        className="container"
        style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--s-md)" }}
      >
        <a href="#/" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink)", textDecoration: "none" }}>
          <VistaMark />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Vista
          </span>
        </a>

        <nav className="nav-links">
          <a href="#features">{t("landing.nav.features")}</a>
          <a href="#how">{t("landing.nav.how")}</a>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-sm)" }}>
          <LangToggle />
          <a href={VISTA_GITHUB} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm nav-github" style={{ textDecoration: "none" }}>
            <GitHubIcon />
            {t("landing.nav.github")}
          </a>
          <button className="btn btn-secondary btn-sm nav-login" onClick={() => navigate("/login")}>
            {t("landing.nav.login")}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate("/signup")}>
            {t("landing.nav.signup")}
          </button>
        </div>
      </div>

      <style>{`
        .nav-links { display: flex; gap: var(--s-lg); font-size: 14px; }
        .nav-links a { color: var(--body); text-decoration: none; }
        @media (max-width: 900px) { .nav-links { display: none; } }
        @media (max-width: 680px) { .nav-github { display: none !important; } }
        @media (max-width: 520px) { .nav-login { display: none !important; } }
      `}</style>
    </header>
  );
}
