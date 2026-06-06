import { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/i18n";
import { createRequest } from "../lib/api";
import { useFocusTrap } from "../lib/useFocusTrap";
import { CloseIcon, CheckIcon, ArrowRight, SparklesIcon, BugIcon, QuestionIcon, TagIcon } from "./Icons";

const TYPES = [
  { key: "feature", Icon: SparklesIcon },
  { key: "bug", Icon: BugIcon },
  { key: "question", Icon: QuestionIcon },
  { key: "other", Icon: TagIcon },
];

const EMPTY = { type: "feature", title: "", description: "", name: "", email: "" };

export default function IssueModal({ open, onClose, projectId }) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null); // { url, number }
  const [touched, setTouched] = useState(false);
  const dialogRef = useRef(null);
  const firstFieldRef = useRef(null);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setStatus("idle");
      setErrorMsg("");
      setResult(null);
      setTouched(false);
      setTimeout(() => firstFieldRef.current?.focus(), 60);
    }
  }, [open]);

  // Esc to close + body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useFocusTrap(dialogRef, open);

  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const titleInvalid = touched && !form.title.trim();

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!form.title.trim()) return;

    setStatus("submitting");
    setErrorMsg("");
    try {
      // Mock backend (project-aware). A real backend would create a GitHub issue.
      const res = await createRequest({ projectId, ...form, lang });
      setResult({ url: res.url, number: res.number });
      setStatus("success");
    } catch {
      setErrorMsg(t("form.errorGeneric"));
      setStatus("error");
    }
  };

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onMouseDown={onBackdrop}
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
        aria-label={t("form.title")}
        style={{
          width: "100%",
          maxWidth: 560,
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
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "var(--s-md)",
            padding: "var(--s-lg) var(--s-xl)",
            borderBottom: "1px solid var(--hairline)",
          }}
        >
          <div>
            <h2 className="title-lg" style={{ margin: 0 }}>
              {t("form.title")}
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>{t("form.subtitle")}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("form.close")}
            style={{
              border: "1px solid var(--hairline)",
              background: "var(--canvas)",
              borderRadius: "var(--r-full)",
              width: 36,
              height: 36,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "var(--ink)",
              flexShrink: 0,
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        {status === "success" ? (
          <div style={{ padding: "var(--s-xxl) var(--s-xl)", textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                margin: "0 auto var(--s-md)",
                borderRadius: "var(--r-full)",
                background: "rgba(0,100,0,0.1)",
                color: "var(--success)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <CheckIcon size={26} />
            </div>
            <h3 className="title-lg" style={{ marginBottom: 6 }}>
              {t("form.successTitle")}
            </h3>
            <p style={{ color: "var(--muted)", marginBottom: "var(--s-lg)" }}>{t("form.successMsg")}</p>
            <div style={{ display: "flex", gap: "var(--s-sm)", justifyContent: "center", flexWrap: "wrap" }}>
              {result?.url && (
                <a href={result.url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ textDecoration: "none" }}>
                  {t("form.viewIssue")}
                  {result.number ? ` #${result.number}` : ""}
                  <ArrowRight size={15} />
                </a>
              )}
              <button
                className="btn btn-primary"
                onClick={() => {
                  setForm(EMPTY);
                  setStatus("idle");
                  setTouched(false);
                  setTimeout(() => firstFieldRef.current?.focus(), 30);
                }}
              >
                {t("form.another")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ padding: "var(--s-xl)", display: "flex", flexDirection: "column", gap: "var(--s-lg)" }}>
            {/* Type */}
            <div>
              <label className="field-label">{t("form.typeLabel")}</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--s-xs)" }}>
                {TYPES.map((ty) => {
                  const active = form.type === ty.key;
                  return (
                    <button
                      key={ty.key}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: ty.key }))}
                      aria-pressed={active}
                      style={{
                        padding: "10px 6px",
                        borderRadius: "var(--r-md)",
                        border: active ? "1px solid var(--ink)" : "1px solid var(--hairline)",
                        background: active ? "var(--ink)" : "var(--canvas)",
                        color: active ? "var(--on-primary)" : "var(--body)",
                        fontFamily: "var(--font)",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        transition: "all 0.15s",
                      }}
                    >
                      <ty.Icon size={18} />
                      {t(`form.type${ty.key.charAt(0).toUpperCase() + ty.key.slice(1)}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="field-label" htmlFor="vista-title">
                {t("form.titleLabel")}
              </label>
              <input
                id="vista-title"
                ref={firstFieldRef}
                className="input"
                value={form.title}
                onChange={set("title")}
                placeholder={t("form.titlePlaceholder")}
                style={titleInvalid ? { borderColor: "var(--sig-coral)" } : undefined}
              />
              {titleInvalid && (
                <span style={{ color: "var(--sig-coral)", fontSize: 12, marginTop: 4, display: "block" }}>
                  {t("form.required")}
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="field-label" htmlFor="vista-desc">
                {t("form.descLabel")}
              </label>
              <textarea
                id="vista-desc"
                className="textarea"
                value={form.description}
                onChange={set("description")}
                placeholder={t("form.descPlaceholder")}
              />
            </div>

            {/* Name + email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-md)" }} className="modal-two-col">
              <div>
                <label className="field-label" htmlFor="vista-name">
                  {t("form.nameLabel")}{" "}
                  <span style={{ color: "var(--border-strong)", fontWeight: 400 }}>· {t("form.optional")}</span>
                </label>
                <input id="vista-name" className="input" value={form.name} onChange={set("name")} placeholder={t("form.namePlaceholder")} />
              </div>
              <div>
                <label className="field-label" htmlFor="vista-email">
                  {t("form.emailLabel")}{" "}
                  <span style={{ color: "var(--border-strong)", fontWeight: 400 }}>· {t("form.optional")}</span>
                </label>
                <input id="vista-email" type="email" className="input" value={form.email} onChange={set("email")} placeholder={t("form.emailPlaceholder")} />
              </div>
            </div>

            {status === "error" && (
              <div
                style={{
                  background: "rgba(170,45,0,0.08)",
                  border: "1px solid rgba(170,45,0,0.3)",
                  color: "var(--sig-coral)",
                  borderRadius: "var(--r-md)",
                  padding: "10px 14px",
                  fontSize: 13,
                }}
              >
                <strong style={{ fontWeight: 600 }}>{t("form.errorTitle")}.</strong> {errorMsg}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={status === "submitting"} style={{ width: "100%" }}>
              {status === "submitting" ? t("form.submitting") : t("form.submit")}
            </button>
          </form>
        )}
      </div>

      <style>{`
        @media (max-width: 480px) {
          .modal-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
