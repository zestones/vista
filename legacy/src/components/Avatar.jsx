const COLORS = ["#aa2d00", "#1b61c9", "#0a2e0e", "#d9a441", "#254fad", "#006400", "#8a3ffc", "#0e7490"];

function colorFor(s) {
  let h = 0;
  for (let i = 0; i < (s || "").length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

export default function Avatar({ name, url, size = 18 }) {
  const label = name || "?";
  if (url) {
    return (
      <img
        src={url}
        alt={label}
        title={label}
        width={size}
        height={size}
        style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0, display: "block" }}
      />
    );
  }
  const initials = label
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      title={label}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: colorFor(label),
        color: "#fff",
        fontSize: Math.round(size * 0.42),
        fontWeight: 600,
        display: "inline-grid",
        placeItems: "center",
        flexShrink: 0,
        fontFamily: "var(--font)",
        lineHeight: 1,
      }}
    >
      {initials}
    </span>
  );
}
