import { useI18n } from "../lib/i18n";
import { fmtFull } from "../lib/github";

export default function MilestonesTable({ groups }) {
  const { t, locale } = useI18n();
  if (!groups?.length) return null;

  return (
    <div className="mt">
      <div className="mt-head">
        <span>{t("mt.milestone")}</span>
        <span>{t("mt.progress")}</span>
        <span className="mt-c">{t("mt.requests")}</span>
        <span className="mt-r">{t("mt.due")}</span>
      </div>

      {groups.map((g) => (
        <div className="mt-row" key={g.id}>
          <div className="mt-name">
            <span className="mt-dot" style={{ background: g.color || "var(--ink)" }} />
            <div style={{ minWidth: 0 }}>
              <div className="mt-title">{g.title}</div>
              {g.description && <div className="mt-desc">{g.description}</div>}
            </div>
          </div>

          <div className="mt-prog">
            <span className="mt-lbl">{t("mt.progress")}</span>
            <div className="mt-bar">
              <div style={{ width: `${g.pct}%`, background: g.color || "var(--success)" }} />
            </div>
            <span className="mt-pct tnum">{g.pct}%</span>
          </div>

          <div className="mt-req">
            <span className="mt-lbl">{t("mt.requests")}</span>
            <span className="tnum">{g.closed}/{g.total}</span>
          </div>

          <div className="mt-due">
            <span className="mt-lbl">{t("mt.due")}</span>
            <span style={{ color: g.due ? "var(--body)" : "var(--border-strong)" }}>
              {g.due ? fmtFull(g.due, locale) : t("milestones.noDue")}
            </span>
          </div>
        </div>
      ))}

      <style>{`
        .mt { border: 1px solid var(--hairline); border-radius: var(--r-lg); overflow: hidden; background: var(--canvas); }
        .mt-head, .mt-row {
          display: grid;
          grid-template-columns: 1fr 36% 110px 150px;
          gap: var(--s-md);
          align-items: center;
          padding: 14px 16px;
        }
        .mt-head {
          background: var(--surface-soft);
          border-bottom: 1px solid var(--hairline);
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted);
        }
        .mt-head .mt-c { text-align: center; }
        .mt-head .mt-r { text-align: right; }
        .mt-row { border-top: 1px solid var(--hairline); }
        .mt-row:first-of-type { border-top: none; }
        .mt-name { display: flex; gap: 10px; align-items: flex-start; }
        .mt-dot { width: 10px; height: 10px; border-radius: 3px; margin-top: 5px; flex-shrink: 0; }
        .mt-title { font-weight: 600; color: var(--ink); }
        .mt-desc {
          font-size: 12px; color: var(--muted); line-height: 1.45; margin-top: 2px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .mt-prog { display: flex; align-items: center; gap: 12px; }
        .mt-bar { flex: 1; height: 6px; min-width: 60px; background: var(--surface-strong); border-radius: var(--r-xs); overflow: hidden; }
        .mt-bar > div { height: 100%; border-radius: var(--r-xs); }
        .mt-pct { font-size: 13px; font-weight: 600; color: var(--ink); min-width: 38px; text-align: right; }
        .mt-req { text-align: center; color: var(--body); }
        .mt-due { text-align: right; color: var(--body); white-space: nowrap; }
        .mt-lbl { display: none; }

        @media (max-width: 760px) {
          .mt-head { display: none; }
          .mt-row { grid-template-columns: 1fr; gap: 10px; padding: 16px; }
          .mt-req, .mt-due { display: flex; align-items: center; justify-content: space-between; text-align: left; }
          .mt-lbl { display: inline; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
          .mt-pct { min-width: auto; }
        }
      `}</style>
    </div>
  );
}
