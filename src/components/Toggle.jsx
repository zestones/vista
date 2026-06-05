export default function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 999,
        border: "none",
        padding: 2,
        cursor: disabled ? "not-allowed" : "pointer",
        background: checked ? "var(--success)" : "var(--surface-strong)",
        opacity: disabled ? 0.5 : 1,
        transition: "background 0.18s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "block",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.18s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </button>
  );
}
