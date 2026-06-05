import { useI18n } from "../lib/i18n";
import { VISTA_GITHUB } from "../lib/github";
import { navigate } from "../lib/router";
import LandingNav from "./LandingNav";
import DashboardPreview from "./DashboardPreview";
import { Footer } from "./Footer";
import { GitHubIcon, ArrowRight, RouteIcon, MilestoneIcon, InboxIcon } from "./Icons";

// Signature surfaces for the three feature cards.
const FEATURES = [
  { key: "feat1", bg: "var(--sig-coral)", fg: "#ffffff", dim: "rgba(255,255,255,0.78)", Icon: RouteIcon },
  { key: "feat2", bg: "var(--sig-forest)", fg: "#ffffff", dim: "rgba(255,255,255,0.78)", Icon: MilestoneIcon },
  { key: "feat3", bg: "var(--surface-dark)", fg: "#ffffff", dim: "rgba(255,255,255,0.72)", Icon: InboxIcon },
];

const STEPS = ["step1", "step2", "step3"];

export default function Landing() {
  const { t } = useI18n();

  return (
    <>
      <LandingNav />

      {/* ── Hero ── */}
      <section className="section" style={{ paddingBottom: "var(--s-xxl)" }}>
        <div className="container hero-grid">
          <div>
            <div className="eyebrow" style={{ marginBottom: "var(--s-md)" }}>
              {t("landing.hero.eyebrow")}
            </div>
            <h1 className="display-lg" style={{ marginBottom: "var(--s-lg)" }}>
              {t("landing.hero.title")}
            </h1>
            <p className="lead" style={{ maxWidth: 520, marginBottom: "var(--s-xl)" }}>
              {t("landing.hero.subtitle")}
            </p>
            <div style={{ display: "flex", gap: "var(--s-sm)", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={() => navigate("/signup")}>
                {t("landing.hero.ctaPrimary")}
              </button>
              <a href={VISTA_GITHUB} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ textDecoration: "none" }}>
                <GitHubIcon />
                {t("landing.hero.ctaSecondary")}
              </a>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="section" style={{ paddingTop: "var(--s-xxl)" }}>
        <div className="container">
          <div style={{ marginBottom: "var(--s-xl)", maxWidth: 640 }}>
            <div className="eyebrow" style={{ marginBottom: "var(--s-xs)" }}>
              {t("landing.features.eyebrow")}
            </div>
            <h2 className="display-md">{t("landing.features.title")}</h2>
          </div>

          <div className="features-grid">
            {FEATURES.map((f) => (
              <article
                key={f.key}
                style={{
                  background: f.bg,
                  color: f.fg,
                  borderRadius: "var(--r-lg)",
                  padding: "var(--s-xl)",
                  minHeight: 230,
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--s-sm)",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--r-md)",
                    background: "rgba(255,255,255,0.14)",
                    display: "grid",
                    placeItems: "center",
                    marginBottom: "var(--s-xs)",
                  }}
                >
                  <f.Icon size={22} />
                </div>
                <h3 className="title-lg" style={{ color: f.fg }}>
                  {t(`landing.${f.key}.title`)}
                </h3>
                <p style={{ color: f.dim, fontSize: 15, lineHeight: 1.6 }}>{t(`landing.${f.key}.body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works (surface-soft band — keeps the editorial rhythm) ── */}
      <section id="how" className="section" style={{ background: "var(--surface-soft)" }}>
        <div className="container">
          <div style={{ marginBottom: "var(--s-xl)", maxWidth: 640 }}>
            <div className="eyebrow" style={{ marginBottom: "var(--s-xs)" }}>
              {t("landing.how.eyebrow")}
            </div>
            <h2 className="display-md">{t("landing.how.title")}</h2>
          </div>

          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: "flex", flexDirection: "column", gap: "var(--s-sm)" }}>
                <div
                  className="tnum"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--ink)",
                    width: 40,
                    height: 40,
                    borderRadius: "var(--r-full)",
                    border: "1px solid var(--hairline)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {i + 1}
                </div>
                <h3 className="title-sm">{t(`landing.how.${s}.title`)}</h3>
                <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>{t(`landing.how.${s}.body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Signature callout ── */}
      <section className="section" style={{ paddingTop: "var(--s-xxl)", paddingBottom: "var(--s-xxl)" }}>
        <div className="container">
          <div
            style={{
              background: "var(--sig-cream)",
              borderRadius: "var(--r-lg)",
              padding: "var(--s-xxl)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--s-lg)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ maxWidth: 560 }}>
              <h2 className="display-md" style={{ marginBottom: "var(--s-sm)" }}>
                {t("landing.callout.title")}
              </h2>
              <p style={{ color: "var(--body)", fontSize: 16, lineHeight: 1.6 }}>{t("landing.callout.body")}</p>
            </div>
            <button className="btn btn-primary" onClick={() => navigate("/signup")}>
              {t("landing.callout.cta")}
              <ArrowRight />
            </button>
          </div>
        </div>
      </section>

      {/* ── Final CTA band ── */}
      <section className="section" style={{ paddingTop: "var(--s-xl)", paddingBottom: "var(--s-section)" }}>
        <div className="container">
          <div
            style={{
              background: "var(--surface-dark)",
              color: "var(--on-dark)",
              borderRadius: "var(--r-lg)",
              padding: "var(--s-xxl)",
              textAlign: "center",
            }}
          >
            <h2 className="display-md" style={{ color: "var(--on-dark)", marginBottom: "var(--s-xs)" }}>
              {t("landing.cta.title")}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.72)", marginBottom: "var(--s-lg)" }}>{t("landing.cta.subtitle")}</p>
            <button className="btn btn-secondary" onClick={() => navigate("/signup")}>
              {t("landing.cta.button")}
            </button>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--s-xxl);
          align-items: center;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--s-lg);
        }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--s-xl);
        }
        @media (max-width: 960px) {
          .hero-grid { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: 1fr; }
          .steps-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
