import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";
import { navigate } from "../../lib/router";
import { getProject, getRoadmap } from "../../lib/api";
import { overallStats } from "../../lib/github";
import { useMediaQuery } from "../../lib/useMediaQuery";
import StatsStrip from "../StatsStrip";
import Roadmap from "../Roadmap";
import RoadmapMobile from "../RoadmapMobile";
import MilestonesTable from "../MilestonesTable";
import IssueModal from "../IssueModal";
import { GearIcon, PlusIcon, LockIcon, ArrowLeft } from "../Icons";

function Spinner() {
  return <div style={{ width: 30, height: 30, border: "3px solid var(--surface-strong)", borderTopColor: "var(--ink)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />;
}

export default function ProjectDashboard({ id }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 700px)");
  const [project, setProject] = useState(null);
  const [groups, setGroups] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | ready | error | noaccess
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("gantt"); // gantt is the heart of the page
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setPhase("loading");
    setGroups(null);
    getProject(id)
      .then((p) => {
        if (!alive) return;
        if (!p) {
          setPhase("error");
          return;
        }
        const member = p.members.find((m) => m.email?.toLowerCase() === user.email.toLowerCase() && m.status === "active");
        if (!member) {
          setPhase("noaccess");
          navigate("/app");
          return;
        }
        setProject({ ...p, myRole: member.role });
        return getRoadmap(id, lang).then((g) => {
          if (!alive) return;
          setGroups(g);
          setPhase("ready");
        });
      })
      .catch((e) => {
        if (alive) {
          setError(e.message);
          setPhase("error");
        }
      });
    return () => {
      alive = false;
    };
  }, [id, lang, user.email]);

  const stats = useMemo(() => overallStats(groups), [groups]);
  const isOwner = project?.ownerEmail === user.email;
  const isViewer = project?.myRole === "viewer";

  if (phase === "loading" || phase === "noaccess") {
    return (
      <Center>
        <Spinner />
        <span style={{ fontSize: 14, color: "var(--muted)" }}>{t("state.loading")}</span>
      </Center>
    );
  }

  if (phase === "error") {
    return (
      <Center>
        <div className="title-sm">{t("state.errorTitle")}</div>
        {error && <div style={{ fontSize: 14, color: "var(--muted)", maxWidth: 460, textAlign: "center" }}>{error}</div>}
        <button className="btn btn-secondary btn-sm" onClick={() => navigate("/app")}>
          <ArrowLeft size={14} /> {t("pd.back")}
        </button>
      </Center>
    );
  }

  const hasData = groups && groups.length > 0;
  // Only the desktop Gantt locks to the viewport; everything else scrolls naturally.
  const lockHeight = tab === "gantt" && !isMobile;

  return (
    <div
      className="app-page"
      style={{
        paddingTop: "var(--s-lg)",
        paddingBottom: "var(--s-xxl)",
        ...(lockHeight ? { height: "100%", display: "flex", flexDirection: "column", paddingBottom: "var(--s-lg)" } : {}),
      }}
    >
      <button
        onClick={() => navigate("/app")}
        style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, marginBottom: "var(--s-sm)" }}
      >
        <ArrowLeft size={14} /> {t("pd.back")}
      </button>

      {/* Header */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--s-md)", flexWrap: "wrap", marginBottom: "var(--s-md)" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: project.color || "var(--ink)", flexShrink: 0 }} />
            <h1 className="display-md">{project.name}</h1>
          </div>
          {project.description && <p style={{ color: "var(--muted)", maxWidth: 620, marginTop: 4 }}>{project.description}</p>}
        </div>
        <div style={{ display: "flex", gap: "var(--s-sm)", flexShrink: 0 }}>
          {isOwner && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/app/projects/${id}/settings`)}>
              <GearIcon size={14} /> {t("pd.manage")}
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <PlusIcon size={14} /> {t("dash.newRequest")}
          </button>
        </div>
      </div>

      {isViewer && (
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--surface-soft)", border: "1px solid var(--hairline)", borderRadius: "var(--r-md)", color: "var(--muted)", fontSize: 13, marginBottom: "var(--s-md)" }}>
          <LockIcon size={14} /> {t("pd.viewerNote")}
        </div>
      )}

      {!hasData ? (
        <Center>
          <div className="title-sm">{t("state.empty")}</div>
        </Center>
      ) : (
        <>
          {/* View switch */}
          <div style={{ flexShrink: 0, marginBottom: "var(--s-md)" }}>
            <div className="segmented" role="group" aria-label="View">
              <button aria-pressed={tab === "gantt"} onClick={() => setTab("gantt")}>{t("dash.tab.gantt")}</button>
              <button aria-pressed={tab === "overview"} onClick={() => setTab("overview")}>{t("dash.tab.overview")}</button>
            </div>
          </div>

          {tab === "gantt" ? (
            isMobile ? (
              // Phone: a vertical, list-based roadmap (no horizontal timeline).
              <RoadmapMobile groups={groups} />
            ) : (
              // Desktop: the Gantt fills the remaining viewport height.
              <div style={{ flex: 1, minHeight: 420, display: "flex", flexDirection: "column" }}>
                <Roadmap groups={groups} embedded />
              </div>
            )
          ) : (
            // Overview scrolls with the page.
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-lg)" }}>
              <StatsStrip stats={stats} />
              <MilestonesTable groups={groups} />
            </div>
          )}
        </>
      )}

      <IssueModal open={modalOpen} onClose={() => setModalOpen(false)} projectId={id} />
    </div>
  );
}

function Center({ children }) {
  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--s-md)", padding: "var(--s-lg)" }}>
      {children}
    </div>
  );
}
