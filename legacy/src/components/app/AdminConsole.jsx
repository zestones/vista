import { useEffect, useState } from "react";
import { useI18n } from "../../lib/i18n";
import { useData } from "../../lib/store";
import { navigate } from "../../lib/router";
import { getOwnedProjects, updateProject } from "../../lib/api";
import { useAppUI } from "./AppShell";
import Toggle from "../Toggle";
import { PlusIcon, GearIcon, ShieldIcon } from "../Icons";

function StatTile({ value, label, accent }) {
  return (
    <div style={{ padding: "var(--s-lg)", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", background: "var(--canvas)" }}>
      <div className="tnum" style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500, color: accent || "var(--ink)", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{label}</div>
    </div>
  );
}

export default function AdminConsole() {
  const { t } = useI18n();
  const { version, refresh } = useData();
  const ui = useAppUI();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let alive = true;
    getOwnedProjects().then((r) => alive && setRows(r));
    return () => {
      alive = false;
    };
  }, [version]);

  const patch = async (id, p) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r))); // optimistic
    await updateProject(id, p);
    refresh();
  };

  const stats = rows
    ? {
        projects: rows.length,
        available: rows.filter((r) => r.availableOnVista).length,
        shared: rows.filter((r) => r.visibility === "shared").length,
        pending: rows.reduce((n, r) => n + r.members.filter((m) => m.status === "pending").length, 0),
      }
    : null;

  return (
    <div className="app-page" style={{ paddingTop: "var(--s-xl)", paddingBottom: "var(--s-section)" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--s-md)", flexWrap: "wrap", marginBottom: "var(--s-xl)" }}>
        <div>
          <div className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "var(--s-xs)" }}>
            <ShieldIcon size={13} /> {t("side.admin")}
          </div>
          <h1 className="display-md" style={{ marginBottom: 4 }}>{t("admin.title")}</h1>
          <p style={{ color: "var(--muted)", maxWidth: 560 }}>{t("admin.subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={ui.openNewProject}>
          <PlusIcon /> {t("side.newProject")}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--s-md)", marginBottom: "var(--s-xl)" }}>
          <StatTile value={stats.projects} label={t("admin.stat.projects")} />
          <StatTile value={stats.available} label={t("admin.stat.available")} accent="var(--success)" />
          <StatTile value={stats.shared} label={t("admin.stat.shared")} accent="var(--link)" />
          <StatTile value={stats.pending} label={t("admin.stat.pending")} accent={stats.pending ? "var(--sig-coral)" : "var(--ink)"} />
        </div>
      )}

      {/* Table */}
      <div style={{ border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", overflow: "hidden", background: "var(--canvas)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ background: "var(--surface-soft)", borderBottom: "1px solid var(--hairline)" }}>
                {[t("admin.col.project"), t("admin.col.available"), t("admin.col.visibility"), t("admin.col.members"), t("admin.col.requests"), ""].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      textAlign: i >= 1 && i <= 4 ? "center" : "left",
                      padding: "12px 16px",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!rows ? (
                <tr>
                  <td colSpan={6} style={{ padding: "var(--s-xxl)", textAlign: "center" }}>
                    <div style={{ width: 26, height: 26, margin: "0 auto", border: "3px solid var(--surface-strong)", borderTopColor: "var(--ink)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "var(--s-xxl)", textAlign: "center", color: "var(--muted)" }}>
                    {t("admin.empty")}
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const pending = r.members.filter((m) => m.status === "pending").length;
                  const active = r.members.filter((m) => m.status === "active").length;
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: r.color || "var(--ink)", flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--ink)" }}>{r.name}</div>
                            <div style={{ fontSize: 12, color: "var(--muted)" }}>{r.source?.type === "github" ? `${r.source.owner}/${r.source.repo}` : t("np.sourceMock")}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "inline-flex" }}>
                          <Toggle checked={r.availableOnVista} onChange={(v) => patch(r.id, { availableOnVista: v })} label={t("admin.col.available")} />
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <Toggle
                            checked={r.visibility === "shared"}
                            onChange={(v) => patch(r.id, { visibility: v ? "shared" : "private" })}
                            label={t("status.shared")}
                          />
                          <span style={{ fontSize: 12, color: "var(--muted)", minWidth: 52 }}>
                            {r.visibility === "shared" ? t("status.shared") : t("status.private")}
                          </span>
                        </div>
                      </td>
                      <td className="tnum" style={{ padding: "14px 16px", textAlign: "center", color: "var(--body)" }}>{active}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        {pending > 0 ? (
                          <span className="tnum" style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: "var(--sig-coral)", borderRadius: "var(--r-sm)", padding: "2px 9px" }}>{pending}</span>
                        ) : (
                          <span style={{ color: "var(--border-strong)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/app/projects/${r.id}/settings`)}>
                          <GearIcon size={14} /> {t("admin.col.manage")}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
