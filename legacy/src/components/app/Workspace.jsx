import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import { useData } from "../../lib/store";
import { navigate } from "../../lib/router";
import { getProjectsForUser } from "../../lib/api";
import { mockStats } from "../../lib/mockData";
import { useAppUI } from "./AppShell";
import { PlusIcon, UsersIcon, GearIcon, ArrowRight, GlobeIcon, LockIcon } from "../Icons";

function Badge({ tone, icon, children }) {
  const tones = {
    green: { bg: "rgba(0,100,0,0.1)", fg: "var(--success)" },
    muted: { bg: "var(--surface-strong)", fg: "var(--muted)" },
    blue: { bg: "rgba(27,97,201,0.1)", fg: "var(--link)" },
  };
  const s = tones[tone] || tones.muted;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: "var(--r-sm)", background: s.bg, color: s.fg }}>
      {icon}
      {children}
    </span>
  );
}

function ProjectCard({ p, isOwner }) {
  const { t, lang } = useI18n();
  const pending = p.members.filter((m) => m.status === "pending").length;
  const active = p.members.filter((m) => m.status === "active").length;
  const stats = useMemo(
    () => (p.source?.type !== "github" ? mockStats(p.seed || p.id, lang) : null),
    [p.seed, p.id, p.source?.type, lang]
  );

  return (
    <article
      style={{
        height: "100%",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--r-lg)",
        background: "var(--canvas)",
        padding: "var(--s-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-sm)",
      }}
    >
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span style={{ width: 11, height: 11, borderRadius: 3, background: p.color || "var(--ink)", flexShrink: 0 }} />
        <h3
          className="title-sm"
          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}
        >
          {p.name}
        </h3>
      </div>

      {/* Status badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {p.availableOnVista ? <Badge tone="green">{t("status.available")}</Badge> : <Badge tone="muted">{t("status.unavailable")}</Badge>}
        {p.visibility === "shared" ? (
          <Badge tone="blue" icon={<GlobeIcon size={12} />}>{t("status.shared")}</Badge>
        ) : (
          <Badge tone="muted" icon={<LockIcon size={12} />}>{t("status.private")}</Badge>
        )}
      </div>

      {p.description && (
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {p.description}
        </p>
      )}

      {/* Progress (pushed to the bottom so cards align) */}
      <div style={{ marginTop: "auto", paddingTop: "var(--s-xs)" }}>
        {stats && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 5 }}>
              <span className="tnum">{stats.closed}/{stats.total} {t("milestones.tasks")}</span>
              <span className="tnum" style={{ fontWeight: 600, color: "var(--ink)" }}>{stats.pct}%</span>
            </div>
            <div style={{ height: 6, background: "var(--surface-strong)", borderRadius: "var(--r-xs)", overflow: "hidden" }}>
              <div style={{ width: `${stats.pct}%`, height: "100%", background: p.color || "var(--success)", borderRadius: "var(--r-xs)" }} />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--s-sm)", paddingTop: "var(--s-sm)", borderTop: "1px solid var(--hairline)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
          <UsersIcon size={14} /> {active}
          {isOwner && pending > 0 && <span style={{ color: "var(--sig-coral)", fontWeight: 600 }}>· {pending} {t("ws.pending")}</span>}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {isOwner && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/app/projects/${p.id}/settings`)} title={t("ws.manage")} aria-label={t("ws.manage")}>
              <GearIcon size={14} />
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/app/projects/${p.id}`)}>
            {t("ws.open")}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

function Grid({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--s-lg)" }}>{children}</div>;
}

export default function Workspace() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { version } = useData();
  const ui = useAppUI();
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    getProjectsForUser().then((r) => alive && setData(r));
    return () => {
      alive = false;
    };
  }, [version]);

  return (
    <div className="app-page" style={{ paddingTop: "var(--s-xl)", paddingBottom: "var(--s-section)" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--s-md)", flexWrap: "wrap", marginBottom: "var(--s-xl)" }}>
        <div>
          <h1 className="display-md" style={{ marginBottom: 4 }}>{t("ws.title")}</h1>
          <p style={{ color: "var(--muted)" }}>{t("ws.subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={ui.openNewProject}>
          <PlusIcon /> {t("side.newProject")}
        </button>
      </div>

      {!data ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--s-section) 0" }}>
          <div style={{ width: 28, height: 28, border: "3px solid var(--surface-strong)", borderTopColor: "var(--ink)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : data.owned.length === 0 && data.joined.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--s-section) var(--s-lg)", border: "1px dashed var(--hairline)", borderRadius: "var(--r-lg)" }}>
          <p style={{ color: "var(--muted)", marginBottom: "var(--s-md)" }}>{t("ws.empty")}</p>
          <button className="btn btn-primary" onClick={ui.openNewProject}>
            <PlusIcon /> {t("ws.createFirst")}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-xxl)" }}>
          {data.owned.length > 0 && (
            <section>
              <div className="eyebrow" style={{ marginBottom: "var(--s-md)" }}>{t("ws.owned")}</div>
              <Grid>
                {data.owned.map((p) => (
                  <ProjectCard key={p.id} p={p} isOwner />
                ))}
              </Grid>
            </section>
          )}
          {data.joined.length > 0 && (
            <section>
              <div className="eyebrow" style={{ marginBottom: "var(--s-md)" }}>{t("ws.joined")}</div>
              <Grid>
                {data.joined.map((p) => (
                  <ProjectCard key={p.id} p={p} isOwner={false} />
                ))}
              </Grid>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
