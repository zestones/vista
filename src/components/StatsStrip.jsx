import { useI18n } from "../lib/i18n";

function ProgressRing({ pct, size = 96, stroke = 9 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-strong)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--success)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div
        className="tnum"
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-display)",
          fontSize: 22,
          fontWeight: 600,
          color: "var(--ink)",
        }}
      >
        {pct}%
      </div>
    </div>
  );
}

function Tile({ value, label, sub, accent }) {
  return (
    <div>
      <div
        className="tnum"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 30,
          fontWeight: 500,
          lineHeight: 1,
          color: accent || "var(--ink)",
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--muted)" }}>{sub}</div>}
    </div>
  );
}

export default function StatsStrip({ stats }) {
  const { t } = useI18n();
  if (!stats) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--s-xxl)",
        flexWrap: "wrap",
        padding: "var(--s-xl)",
        background: "var(--surface-soft)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--r-lg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-lg)" }}>
        <ProgressRing pct={stats.pct} />
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            {t("dash.completion")}
          </div>
          <div style={{ fontSize: 14, color: "var(--muted)", maxWidth: 180 }}>
            {stats.closed}/{stats.total} {t("stats.tasks")} · {stats.milestones} {t("stats.milestones").toLowerCase()}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, auto)",
          gap: "var(--s-xxl)",
          marginLeft: "auto",
        }}
        className="stats-tiles"
      >
        <Tile value={stats.milestones} label={t("stats.milestones")} />
        <Tile value={stats.open} label={t("stats.open")} sub={t("stats.tasks")} accent="var(--link)" />
        <Tile value={stats.closed} label={t("stats.closed")} sub={t("stats.tasks")} accent="var(--success)" />
      </div>

      <style>{`
        @media (max-width: 720px) {
          .stats-tiles { margin-left: 0 !important; gap: var(--s-xl) !important; }
        }
      `}</style>
    </div>
  );
}
