import { useI18n } from "../lib/i18n";

export default function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="segmented" role="group" aria-label="Language">
      {["fr", "en"].map((l) => (
        <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
