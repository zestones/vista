import { useEffect, useState } from "react";
import { useI18n } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import { useData } from "../../lib/store";
import { navigate } from "../../lib/router";
import {
  getProject,
  updateProject,
  deleteProject,
  approveRequest,
  denyRequest,
  removeMember,
  setMemberRole,
  rotateInvite,
  inviteUrl,
  ROLES,
} from "../../lib/api";
import Toggle from "../Toggle";
import { CopyIcon, LinkIcon, CheckIcon, TrashIcon, UsersIcon, ArrowLeft } from "../Icons";

function Spinner() {
  return <div style={{ width: 28, height: 28, border: "3px solid var(--surface-strong)", borderTopColor: "var(--ink)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />;
}

const Avatar = ({ name }) => (
  <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface-strong)", color: "var(--ink)", display: "grid", placeItems: "center", fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
    {(name || "?").charAt(0).toUpperCase()}
  </span>
);

export default function ProjectSettings({ id }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { version, refresh } = useData();
  const [project, setProject] = useState(null);
  const [tab, setTab] = useState("general");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    getProject(id).then((p) => {
      if (!alive) return;
      setProject(p);
      setLoaded(true);
      if (p && p.ownerEmail !== user.email) navigate(`/app/projects/${id}`);
    });
    return () => {
      alive = false;
    };
  }, [id, version, user.email]);

  if (!loaded) return <Pad><Spinner /></Pad>;
  if (!project) return <Pad><p style={{ color: "var(--muted)" }}>{t("join.invalidMsg")}</p></Pad>;

  const pending = project.members.filter((m) => m.status === "pending");
  const active = project.members.filter((m) => m.status === "active");

  return (
    <div className="app-page" style={{ paddingTop: "var(--s-xl)", paddingBottom: "var(--s-section)" }}>
      <button onClick={() => navigate("/app/admin")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, marginBottom: "var(--s-md)" }}>
        <ArrowLeft size={14} /> {t("ps.back")}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--s-lg)" }}>
        <span style={{ width: 14, height: 14, borderRadius: 4, background: project.color || "var(--ink)" }} />
        <h1 className="display-md">{project.name}</h1>
      </div>

      {/* Tabs */}
      <div className="segmented" style={{ marginBottom: "var(--s-xl)", flexWrap: "wrap" }}>
        {[
          ["general", t("ps.tab.general")],
          ["members", `${t("ps.tab.members")} · ${active.length}`],
          ["requests", `${t("ps.tab.requests")}${pending.length ? ` · ${pending.length}` : ""}`],
          ["invite", t("ps.tab.invite")],
        ].map(([k, label]) => (
          <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "general" && <GeneralTab project={project} onChange={refresh} />}
      {tab === "members" && <MembersTab project={project} active={active} me={user} onChange={refresh} />}
      {tab === "requests" && <RequestsTab project={project} pending={pending} onChange={refresh} />}
      {tab === "invite" && <InviteTab project={project} onChange={refresh} />}
    </div>
  );
}

function Pad({ children }) {
  return <div className="app-page" style={{ paddingTop: "var(--s-section)", display: "flex", justifyContent: "center" }}>{children}</div>;
}

function Card({ children, title, hint }) {
  return (
    <section style={{ border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", padding: "var(--s-xl)", background: "var(--canvas)", marginBottom: "var(--s-lg)" }}>
      {title && (
        <div style={{ marginBottom: "var(--s-md)" }}>
          <h2 className="title-sm">{title}</h2>
          {hint && <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>{hint}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

function GeneralTab({ project, onChange }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: project.name, description: project.description, visibility: project.visibility, availableOnVista: project.availableOnVista });
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    await updateProject(project.id, form);
    onChange();
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const del = async () => {
    if (!window.confirm(t("ps.deleteConfirm"))) return;
    await deleteProject(project.id);
    onChange();
    navigate("/app/admin");
  };

  return (
    <>
      <Card title={t("ps.gen.title")}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-lg)" }}>
          <div>
            <label className="field-label">{t("ps.gen.name")}</label>
            <input className="input" value={form.name} onChange={set("name")} />
          </div>
          <div>
            <label className="field-label">{t("ps.gen.desc")}</label>
            <input className="input" value={form.description} onChange={set("description")} />
          </div>

          <div>
            <label className="field-label">{t("ps.gen.visibility")}</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-xs)" }}>
              {[["private", t("ps.gen.visPrivate")], ["shared", t("ps.gen.visShared")]].map(([k, l]) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: form.visibility === k ? "1px solid var(--ink)" : "1px solid var(--hairline)", borderRadius: "var(--r-md)", cursor: "pointer", background: form.visibility === k ? "var(--surface-soft)" : "var(--canvas)" }}>
                  <input type="radio" name="vis" checked={form.visibility === k} onChange={() => setForm((f) => ({ ...f, visibility: k }))} />
                  <span style={{ fontSize: 14, color: "var(--body)" }}>{l}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--s-md)", padding: "var(--s-md)", border: "1px solid var(--hairline)", borderRadius: "var(--r-md)" }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 14 }}>{t("ps.gen.available")}</div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{t("ps.gen.availableHint")}</div>
            </div>
            <Toggle checked={form.availableOnVista} onChange={(v) => setForm((f) => ({ ...f, availableOnVista: v }))} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-sm)" }}>
            <button className="btn btn-primary" onClick={save}>{t("ps.gen.save")}</button>
            {saved && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--success)", fontSize: 13, fontWeight: 600 }}><CheckIcon size={15} /> {t("ps.gen.saved")}</span>}
          </div>
        </div>
      </Card>

      <section style={{ border: "1px solid rgba(170,45,0,0.3)", borderRadius: "var(--r-lg)", padding: "var(--s-xl)", background: "rgba(170,45,0,0.03)" }}>
        <h2 className="title-sm" style={{ color: "var(--sig-coral)" }}>{t("ps.danger")}</h2>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 var(--s-md)" }}>{t("ps.dangerHint")}</p>
        <button onClick={del} className="btn btn-sm" style={{ background: "var(--sig-coral)", color: "#fff" }}>
          <TrashIcon size={14} /> {t("ps.delete")}
        </button>
      </section>
    </>
  );
}

function RoleSelect({ value, onChange }) {
  const { t } = useI18n();
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)} style={{ height: 38, width: "auto", padding: "6px 10px" }}>
      {ROLES.map((r) => (
        <option key={r} value={r}>{t(`role.${r}`)}</option>
      ))}
    </select>
  );
}

function MembersTab({ project, active, me, onChange }) {
  const { t } = useI18n();
  return (
    <Card title={t("ps.mem.title")}>
      {active.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>{t("ps.mem.empty")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {active.map((m, i) => {
            const isMe = m.email?.toLowerCase() === me.email.toLowerCase();
            const isOwner = m.role === "owner";
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "var(--s-md)", padding: "12px 0", borderTop: i ? "1px solid var(--hairline)" : "none" }}>
                <Avatar name={m.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 14 }}>
                    {m.name} {isMe && <span style={{ color: "var(--muted)", fontWeight: 400 }}>· {t("ps.mem.you")}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{m.email}</div>
                </div>
                {isOwner ? (
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", padding: "0 10px" }}>{t("role.owner")}</span>
                ) : (
                  <>
                    <RoleSelect value={m.role} onChange={async (r) => { await setMemberRole(project.id, m.id, r); onChange(); }} />
                    <button className="btn btn-secondary btn-sm" onClick={async () => { await removeMember(project.id, m.id); onChange(); }}>
                      {t("ps.mem.remove")}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function RequestsTab({ project, pending, onChange }) {
  const { t } = useI18n();
  const [roles, setRoles] = useState({});
  const roleFor = (id) => roles[id] || "viewer";

  return (
    <Card title={t("ps.req.title")}>
      {pending.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--s-xl) 0", color: "var(--muted)" }}>
          <UsersIcon size={28} />
          <p style={{ marginTop: 8 }}>{t("ps.req.empty")}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {pending.map((m, i) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "var(--s-md)", padding: "14px 0", borderTop: i ? "1px solid var(--hairline)" : "none", flexWrap: "wrap" }}>
              <Avatar name={m.name} />
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 14 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{m.email} · {t("ps.req.requested")}</div>
              </div>
              <RoleSelect value={roleFor(m.id)} onChange={(r) => setRoles((x) => ({ ...x, [m.id]: r }))} />
              <button className="btn btn-primary btn-sm" onClick={async () => { await approveRequest(project.id, m.id, roleFor(m.id)); onChange(); }}>
                <CheckIcon size={14} /> {t("ps.req.approve")}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={async () => { await denyRequest(project.id, m.id); onChange(); }}>
                {t("ps.req.deny")}
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function InviteTab({ project, onChange }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const shared = project.visibility === "shared" && project.availableOnVista;
  const url = inviteUrl(project.inviteToken);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <Card title={t("ps.inv.title")} hint={t("ps.inv.desc")}>
      {!shared ? (
        <div style={{ padding: "var(--s-md)", border: "1px dashed var(--hairline)", borderRadius: "var(--r-md)", color: "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
          <LinkIcon /> {t("ps.inv.disabledHint")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-md)" }}>
          <div style={{ display: "flex", gap: "var(--s-sm)", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", height: 44, border: "1px solid var(--hairline)", borderRadius: "var(--r-sm)", background: "var(--surface-soft)", overflow: "hidden" }}>
              <LinkIcon size={15} />
              <span style={{ fontSize: 13, color: "var(--body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
            </div>
            <button className="btn btn-primary" onClick={copy}>
              {copied ? <><CheckIcon size={15} /> {t("ps.inv.copied")}</> : <><CopyIcon size={15} /> {t("ps.inv.copy")}</>}
            </button>
          </div>
          <div>
            <button
              className="btn btn-secondary btn-sm"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await rotateInvite(project.id);
                onChange();
                setBusy(false);
              }}
            >
              {t("ps.inv.rotate")}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
