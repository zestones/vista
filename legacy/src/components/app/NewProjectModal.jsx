import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../lib/i18n";
import { createProject } from "../../lib/api";
import { useFocusTrap } from "../../lib/useFocusTrap";
import Toggle from "../Toggle";
import { CloseIcon, GridIcon, GitHubIcon } from "../Icons";

const EMPTY = { name: "", description: "", source: "mock", repo: "", visibility: "private", availableOnVista: true };

export default function NewProjectModal({ open, onClose, onCreated }) {
  const { t } = useI18n();
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setTouched(false);
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const nameInvalid = touched && !form.name.trim();
  const repoInvalid = touched && form.source === "github" && !form.repo.includes("/");

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!form.name.trim()) return;
    if (form.source === "github" && !form.repo.includes("/")) return;
    setBusy(true);
    const trimmed = form.repo.trim();
    const slash = trimmed.indexOf("/");
    const owner = trimmed.slice(0, slash);
    const repo = trimmed.slice(slash + 1).replace(/\/.*$/, ""); // ignore anything past owner/repo
    const project = await createProject({
      name: form.name,
      description: form.description,
      source: form.source === "github" ? { type: "github", owner, repo } : { type: "mock" },
      visibility: form.visibility,
      availableOnVista: form.availableOnVista,
    });
    onCreated(project);
  };

  const SourceCard = ({ value, icon, title, hint }) => {
    const active = form.source === value;
    return (
      <button
        type="button"
        onClick={() => setForm((f) => ({ ...f, source: value }))}
        aria-pressed={active}
        style={{
          textAlign: "left",
          padding: "var(--s-md)",
          borderRadius: "var(--r-md)",
          border: active ? "1px solid var(--ink)" : "1px solid var(--hairline)",
          background: active ? "var(--surface-soft)" : "var(--canvas)",
          cursor: "pointer",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <span style={{ color: "var(--ink)", marginTop: 1 }}>{icon}</span>
        <span>
          <span style={{ display: "block", fontWeight: 600, color: "var(--ink)", fontSize: 14 }}>{title}</span>
          <span style={{ display: "block", color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{hint}</span>
        </span>
      </button>
    );
  };

  return (
    <div
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(24,29,38,0.45)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "var(--s-lg)",
        overflowY: "auto",
        animation: "fade-in 0.15s ease",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("np.title")}
        style={{
          width: "100%",
          maxWidth: 540,
          marginTop: "6vh",
          marginBottom: "6vh",
          background: "var(--canvas)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--hairline)",
          boxShadow: "0 30px 80px rgba(24,29,38,0.25)",
          animation: "pop-in 0.18s ease",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--s-md)", padding: "var(--s-lg) var(--s-xl)", borderBottom: "1px solid var(--hairline)" }}>
          <div>
            <h2 className="title-lg" style={{ margin: 0 }}>
              {t("np.title")}
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>{t("np.subtitle")}</p>
          </div>
          <button onClick={onClose} aria-label={t("form.close")} style={{ border: "1px solid var(--hairline)", background: "var(--canvas)", borderRadius: "var(--r-full)", width: 36, height: 36, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--ink)", flexShrink: 0 }}>
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={submit} style={{ padding: "var(--s-xl)", display: "flex", flexDirection: "column", gap: "var(--s-lg)" }}>
          <div>
            <label className="field-label">{t("np.name")}</label>
            <input className="input" value={form.name} onChange={set("name")} placeholder={t("np.namePh")} autoFocus style={nameInvalid ? { borderColor: "var(--sig-coral)" } : undefined} />
            {nameInvalid && <span style={{ color: "var(--sig-coral)", fontSize: 12, marginTop: 4, display: "block" }}>{t("form.required")}</span>}
          </div>

          <div>
            <label className="field-label">{t("np.desc")}</label>
            <input className="input" value={form.description} onChange={set("description")} placeholder={t("np.descPh")} />
          </div>

          <div>
            <label className="field-label">{t("np.source")}</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-sm)" }}>
              <SourceCard value="mock" icon={<GridIcon />} title={t("np.sourceMock")} hint={t("np.sourceMockHint")} />
              <SourceCard value="github" icon={<GitHubIcon />} title={t("np.sourceGithub")} hint={t("np.sourceGithubHint")} />
            </div>
            {form.source === "github" && (
              <div style={{ marginTop: "var(--s-sm)" }}>
                <input className="input" value={form.repo} onChange={set("repo")} placeholder={t("np.repoPh")} style={repoInvalid ? { borderColor: "var(--sig-coral)" } : undefined} />
                {repoInvalid && <span style={{ color: "var(--sig-coral)", fontSize: 12, marginTop: 4, display: "block" }}>{t("np.repo")}</span>}
              </div>
            )}
          </div>

          <div>
            <label className="field-label">{t("np.visibility")}</label>
            <div className="segmented" style={{ display: "inline-flex" }}>
              {[["private", t("np.visPrivate")], ["shared", t("np.visShared")]].map(([k, l]) => (
                <button type="button" key={k} aria-pressed={form.visibility === k} onClick={() => setForm((f) => ({ ...f, visibility: k }))}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <Toggle checked={form.availableOnVista} onChange={(v) => setForm((f) => ({ ...f, availableOnVista: v }))} />
            <span style={{ fontSize: 14, color: "var(--body)" }}>{t("np.available")}</span>
          </label>

          <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: "100%" }}>
            {busy ? t("np.creating") : t("np.create")}
          </button>
        </form>
      </div>
    </div>
  );
}
