import { createContext, useContext, useEffect, useState } from "react";
import { useI18n } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import { useData } from "../../lib/store";
import { useRoute, navigate } from "../../lib/router";
import { getProjectsForUser } from "../../lib/api";
import { VistaMark, GridIcon, ShieldIcon, PlusIcon, MenuIcon } from "../Icons";
import LangToggle from "../LangToggle";
import NewProjectModal from "./NewProjectModal";

const AppUIContext = createContext(null);
export const useAppUI = () => useContext(AppUIContext);

function NavItem({ icon, label, active, onClick, dot, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        textAlign: "left",
        padding: "9px 12px",
        borderRadius: "var(--r-md)",
        border: "none",
        cursor: "pointer",
        fontFamily: "var(--font)",
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        color: active ? "var(--ink)" : "var(--body)",
        background: active ? "var(--surface-strong)" : "transparent",
        transition: "background 0.12s",
      }}
    >
      {dot ? (
        <span style={{ width: 9, height: 9, borderRadius: 3, background: dot, flexShrink: 0 }} />
      ) : (
        <span style={{ color: active ? "var(--ink)" : "var(--muted)", display: "flex" }}>{icon}</span>
      )}
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {badge > 0 && (
        <span
          className="tnum"
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
            background: "var(--sig-coral)",
            borderRadius: "var(--r-sm)",
            padding: "1px 7px",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export default function AppShell({ children }) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const { version, refresh } = useData();
  const path = useRoute();
  const [projects, setProjects] = useState([]);
  const [newOpen, setNewOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    let alive = true;
    getProjectsForUser().then((r) => alive && setProjects([...r.owned, ...r.joined]));
    return () => {
      alive = false;
    };
  }, [version]);

  useEffect(() => setDrawer(false), [path]);

  const pendingTotal = projects
    .filter((p) => p.ownerEmail === user.email)
    .reduce((n, p) => n + p.members.filter((m) => m.status === "pending").length, 0);

  const go = (p) => () => navigate(p);
  const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();

  const nav = (
    <>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <NavItem icon={<GridIcon />} label={t("side.overview")} active={path === "/app"} onClick={go("/app")} />
        <NavItem
          icon={<ShieldIcon />}
          label={t("side.admin")}
          active={path.startsWith("/app/admin")}
          onClick={go("/app/admin")}
          badge={pendingTotal}
        />
      </nav>

      <div style={{ marginTop: "var(--s-lg)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 12px",
            marginBottom: 6,
          }}
        >
          <span className="eyebrow" style={{ fontSize: 11 }}>
            {t("side.projects")}
          </span>
          <button
            onClick={() => setNewOpen(true)}
            title={t("side.newProject")}
            style={{
              border: "1px solid var(--hairline)",
              background: "var(--canvas)",
              borderRadius: "var(--r-sm)",
              width: 24,
              height: 24,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "var(--ink)",
            }}
          >
            <PlusIcon size={14} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: "40vh", overflowY: "auto" }}>
          {projects.map((p) => (
            <NavItem
              key={p.id}
              dot={p.color || "var(--ink)"}
              label={p.name}
              active={path.startsWith(`/app/projects/${p.id}`)}
              onClick={go(`/app/projects/${p.id}`)}
            />
          ))}
        </div>
      </div>
    </>
  );

  const footer = (
    <div style={{ marginTop: "auto", paddingTop: "var(--s-md)", borderTop: "1px solid var(--hairline)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px" }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: "var(--r-full)",
            background: "var(--ink)",
            color: "var(--on-primary)",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initial}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.name}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 6 }}>
        <LangToggle />
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1 }}
        >
          {t("side.logout")}
        </button>
      </div>
    </div>
  );

  return (
    <AppUIContext.Provider value={{ openNewProject: () => setNewOpen(true) }}>
      <div className="shell">
        {/* Desktop sidebar */}
        <aside className="shell-side">
          <a href="#/app" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink)", textDecoration: "none", padding: "0 8px", marginBottom: "var(--s-lg)" }}>
            <VistaMark />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>Vista</span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--muted)",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--r-sm)",
                padding: "2px 7px",
              }}
            >
              {t("side.mockBadge")}
            </span>
          </a>
          {nav}
          {footer}
        </aside>

        {/* Mobile top bar */}
        <div className="shell-mobilebar">
          <a href="#/app" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink)", textDecoration: "none" }}>
            <VistaMark size={20} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600 }}>Vista</span>
          </a>
          <button onClick={() => setDrawer((d) => !d)} className="btn btn-secondary btn-sm" aria-expanded={drawer} aria-label="Menu">
            <MenuIcon size={18} />
          </button>
        </div>

        {drawer && (
          <div className="shell-drawer">
            {nav}
            {footer}
          </div>
        )}

        <main className="shell-main">{children}</main>
      </div>

      <NewProjectModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(p) => {
          setNewOpen(false);
          refresh();
          navigate(`/app/projects/${p.id}`);
        }}
      />

      <style>{`
        .shell { height: 100vh; display: flex; background: var(--canvas); overflow: hidden; }
        .shell-side {
          width: 264px;
          flex-shrink: 0;
          border-right: 1px solid var(--hairline);
          padding: var(--s-lg) var(--s-md);
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--surface-soft);
        }
        .shell-main { flex: 1; min-width: 0; height: 100vh; overflow-y: auto; }
        .shell-mobilebar { display: none; }
        .shell-drawer { display: none; }
        @media (max-width: 900px) {
          .shell { height: auto; overflow: visible; flex-direction: column; }
          .shell-main { height: auto; overflow: visible; }
          .shell-side { display: none; }
          .shell-mobilebar {
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px var(--s-lg); border-bottom: 1px solid var(--hairline);
            position: sticky; top: 0; z-index: 40; background: rgba(255,255,255,0.9);
            backdrop-filter: blur(8px);
          }
          .shell-drawer {
            display: flex; flex-direction: column; gap: 0;
            padding: var(--s-md) var(--s-lg) var(--s-lg);
            border-bottom: 1px solid var(--hairline);
            background: var(--surface-soft);
            position: sticky; top: 57px; z-index: 39;
            max-height: 80vh; overflow-y: auto;
          }
        }
      `}</style>
    </AppUIContext.Provider>
  );
}
