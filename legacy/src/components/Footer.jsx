import { useI18n } from "../lib/i18n";
import { VISTA_GITHUB } from "../lib/github";
import { VistaMark, GitHubIcon } from "./Icons";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer style={{ borderTop: "1px solid var(--hairline)" }}>
      <div
        className="container"
        style={{
          paddingTop: "var(--s-xxl)",
          paddingBottom: "var(--s-xxl)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--s-md)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <VistaMark size={20} />
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)", fontSize: 16 }}>
              Vista
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{t("footer.tagline")}</div>
          </div>
        </div>

        <a
          href={VISTA_GITHUB}
          target="_blank"
          rel="noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--body)", fontSize: 13 }}
        >
          <GitHubIcon size={15} />
          {t("footer.source")}
        </a>
      </div>
    </footer>
  );
}
