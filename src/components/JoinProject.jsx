import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { useData } from "../lib/store";
import { navigate } from "../lib/router";
import { getProjectByToken, requestAccess } from "../lib/api";
import { VistaMark, CheckIcon, LockIcon, UsersIcon, ArrowRight } from "./Icons";
import LangToggle from "./LangToggle";

export default function JoinProject({ token }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { refresh } = useData();
  const [project, setProject] = useState(null);
  const [state, setState] = useState("loading"); // loading | invalid | idle | pending | member | requested
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getProjectByToken(token).then((p) => {
      if (!alive) return;
      if (!p) {
        setState("invalid");
        return;
      }
      setProject(p);
      const me = p.members.find((m) => m.email?.toLowerCase() === user.email.toLowerCase());
      if (me?.status === "active") setState("member");
      else if (me?.status === "pending") setState("pending");
      else setState("idle");
    });
    return () => {
      alive = false;
    };
  }, [token, user.email]);

  const doRequest = async () => {
    setBusy(true);
    const res = await requestAccess(token);
    refresh();
    if (res.status === "member") setState("member");
    else if (res.status === "invalid") setState("invalid");
    else setState("requested");
    if (res.project) setProject(res.project);
    setBusy(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-soft)" }}>
      <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 var(--s-lg)", borderBottom: "1px solid var(--hairline)", background: "var(--canvas)" }}>
        <a href="#/app" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink)", textDecoration: "none" }}>
          <VistaMark />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>Vista</span>
        </a>
        <LangToggle />
      </header>

      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "var(--s-lg)" }}>
        <div style={{ width: "100%", maxWidth: 460, background: "var(--canvas)", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", boxShadow: "0 20px 50px rgba(24,29,38,0.10)", overflow: "hidden", animation: "pop-in 0.18s ease" }}>
          {state === "loading" && (
            <div style={{ padding: "var(--s-section) 0", display: "grid", placeItems: "center" }}>
              <div style={{ width: 28, height: 28, border: "3px solid var(--surface-strong)", borderTopColor: "var(--ink)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          )}

          {state === "invalid" && (
            <Panel
              icon={<LockIcon size={26} />}
              tone="var(--sig-coral)"
              title={t("join.invalid")}
              body={t("join.invalidMsg")}
              action={<button className="btn btn-secondary" onClick={() => navigate("/")}>{t("join.home")}</button>}
            />
          )}

          {project && (state === "idle" || state === "pending" || state === "member" || state === "requested") && (
            <>
              <div style={{ height: 6, background: project.color || "var(--ink)" }} />
              <div style={{ padding: "var(--s-xl)" }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>{t("join.invitedTo")}</div>
                <h1 className="title-lg" style={{ marginBottom: 6 }}>{project.name}</h1>
                {project.description && <p style={{ color: "var(--muted)", marginBottom: "var(--s-xs)" }}>{project.description}</p>}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)", marginBottom: "var(--s-lg)" }}>
                  <UsersIcon size={14} /> {project.members.filter((m) => m.status === "active").length} {t("ws.members")}
                </div>

                {state === "idle" && (
                  <>
                    <p style={{ color: "var(--body)", marginBottom: "var(--s-lg)" }}>{t("join.intro")}</p>
                    <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy} onClick={doRequest}>
                      {busy ? t("join.requesting") : t("join.request")}
                    </button>
                  </>
                )}

                {(state === "requested" || state === "pending") && (
                  <Inline tone="var(--link)" icon={<CheckIcon size={18} />} title={state === "requested" ? t("join.requested") : t("join.pending")} body={state === "requested" ? t("join.requestedMsg") : t("join.pendingMsg")} />
                )}

                {state === "member" && (
                  <>
                    <Inline tone="var(--success)" icon={<CheckIcon size={18} />} title={t("join.member")} body={t("join.memberMsg")} />
                    <button className="btn btn-primary" style={{ width: "100%", marginTop: "var(--s-md)" }} onClick={() => navigate(`/app/projects/${project.id}`)}>
                      {t("join.open")} <ArrowRight size={15} />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({ icon, tone, title, body, action }) {
  return (
    <div style={{ padding: "var(--s-xxl) var(--s-xl)", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, margin: "0 auto var(--s-md)", borderRadius: "var(--r-full)", background: "var(--surface-soft)", color: tone, display: "grid", placeItems: "center" }}>{icon}</div>
      <h1 className="title-lg" style={{ marginBottom: 6 }}>{title}</h1>
      <p style={{ color: "var(--muted)", marginBottom: "var(--s-lg)" }}>{body}</p>
      {action}
    </div>
  );
}

function Inline({ tone, icon, title, body }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "var(--s-md)", borderRadius: "var(--r-md)", background: "var(--surface-soft)", border: "1px solid var(--hairline)" }}>
      <span style={{ color: tone, marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 600, color: "var(--ink)" }}>{title}</div>
        <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>{body}</div>
      </div>
    </div>
  );
}
