import { useI18n } from "../lib/i18n";

// Pure-CSS stylized roadmap mockup for the landing hero. Decorative only.
const ROWS = [
  { c: "var(--sig-coral)", ms: true, label: "Discovery", pct: 100 },
  { c: "var(--sig-coral)", x: 2, w: 26, done: true },
  { c: "var(--sig-coral)", x: 24, w: 30, done: true },
  { c: "var(--sig-forest)", ms: true, label: "Build", pct: 62 },
  { c: "var(--sig-forest)", x: 30, w: 34, done: true },
  { c: "var(--sig-forest)", x: 48, w: 40 },
  { c: "var(--sig-forest)", x: 56, w: 30 },
  { c: "var(--link)", ms: true, label: "Launch", pct: 10 },
  { c: "var(--link)", x: 70, w: 26 },
];

export default function DashboardPreview() {
  const { t } = useI18n();
  return (
    <div
      aria-hidden="true"
      style={{
        background: "var(--canvas)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--r-lg)",
        boxShadow: "0 30px 70px rgba(24,29,38,0.14), 0 6px 18px rgba(24,29,38,0.06)",
        overflow: "hidden",
        width: "100%",
        maxWidth: 560,
      }}
    >
      {/* window bar */}
      <div
        style={{
          height: 38,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 14px",
          borderBottom: "1px solid var(--hairline)",
          background: "var(--surface-soft)",
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--sig-coral)" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--sig-yellow)" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--sig-mint)" }} />
        <span style={{ marginLeft: 10, fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>
          {t("landing.preview.caption")}
        </span>
      </div>

      {/* rows */}
      <div style={{ padding: "var(--s-md) var(--s-md) var(--s-lg)" }}>
        {ROWS.map((r, i) =>
          r.ms ? (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 8px",
                marginTop: i ? 6 : 0,
                background: "var(--surface-soft)",
                borderRadius: "var(--r-sm)",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 2, background: r.c }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{r.label}</span>
              <span className="tnum" style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>
                {r.pct}%
              </span>
            </div>
          ) : (
            <div key={i} style={{ position: "relative", height: 26 }}>
              <div
                style={{
                  position: "absolute",
                  left: `${r.x}%`,
                  top: 7,
                  width: `${r.w}%`,
                  height: 12,
                  borderRadius: 4,
                  background: r.done ? "transparent" : r.c,
                  border: r.done ? `1px solid ${"var(--hairline)"}` : "none",
                  backgroundImage: r.done
                    ? `repeating-linear-gradient(-45deg, transparent, transparent 3px, ${r.c} 3px, ${r.c} 4px)`
                    : "none",
                  opacity: r.done ? 0.55 : 1,
                }}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}
