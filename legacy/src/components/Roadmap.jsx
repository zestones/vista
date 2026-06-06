import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useI18n } from "../lib/i18n";
import { addDays, daysBetween, fmtShort, fmtFull, fmtMonth, sortRoadmap } from "../lib/github";
import { ChevronRight, ChevronDown, OpenIcon, ClosedIcon, DueIcon, SearchIcon, AlertIcon, CloseIcon, SortIcon, CollapseAllIcon, ExpandAllIcon, MinusIcon, PlusIcon, TodayIcon, CheckIcon } from "./Icons";
import Avatar from "./Avatar";

// ─── Geometry ────────────────────────────────────────────
const ROW_H = 34;
const MS_ROW_H = 46;
const BAR_H = 18;
const LABEL_W = 320;
const MONTH_H = 26;
const SUB_H = 22;
const HEADER_H = MONTH_H + SUB_H;
const MAX_DAY_W = 64;
const ZOOM = { month: 7, week: 16, day: 34 };
const TODAY = "var(--sig-coral)";

function textOn(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#fff";
  const n = parseInt(m[1], 16);
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 150 ? "#181d26" : "#ffffff";
}

export default function Roadmap({ groups, embedded = false, maxHeight = 560 }) {
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState("all");
  const [zoom, setZoom] = useState("week");
  const [msSort, setMsSort] = useState("default");
  const [issueSort, setIssueSort] = useState("chrono");
  const [collapsed, setCollapsed] = useState(() => new Set((groups || []).map((g) => g.id)));
  const [hovered, setHovered] = useState(null);
  const [active, setActive] = useState(null);
  const [tip, setTip] = useState({ x: 0, y: 0 });
  const [viewW, setViewW] = useState(0);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [grabbing, setGrabbing] = useState(false);

  const scrollerRef = useRef(null);
  const roRef = useRef(null);
  const initRef = useRef(false);
  const activeTimer = useRef(null);
  const posRef = useRef({});
  const searchRef = useRef(null);
  const sortRef = useRef(null);
  const wheelRef = useRef(() => {});
  const wheelAttached = useRef(null);
  const now = new Date();

  const setScrollEl = useCallback((el) => {
    if (scrollerRef.current && wheelAttached.current) {
      scrollerRef.current.removeEventListener("wheel", wheelAttached.current);
      wheelAttached.current = null;
    }
    scrollerRef.current = el;
    if (roRef.current) {
      roRef.current.disconnect();
      roRef.current = null;
    }
    if (el) {
      setViewW(el.clientWidth);
      const ro = new ResizeObserver((es) => setViewW(es[0].contentRect.width));
      ro.observe(el);
      roRef.current = ro;
      const h = (e) => wheelRef.current(e);
      el.addEventListener("wheel", h, { passive: false });
      wheelAttached.current = h;
    }
  }, []);

  // Drag-to-pan (grab) the chart.
  const startPan = useCallback((e) => {
    if (e.button !== 0) return;
    const s = scrollerRef.current;
    if (!s) return;
    const st = { x: e.clientX, y: e.clientY, sl: s.scrollLeft, st: s.scrollTop, moved: false };
    const move = (ev) => {
      const dx = ev.clientX - st.x;
      const dy = ev.clientY - st.y;
      if (!st.moved && Math.hypot(dx, dy) < 4) return;
      st.moved = true;
      setGrabbing(true);
      s.scrollLeft = st.sl - dx;
      s.scrollTop = st.st - dy;
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up, true);
      setGrabbing(false);
      if (st.moved) {
        // swallow the click that fires after a drag so bars don't activate
        const sup = (ce) => {
          ce.stopPropagation();
          ce.preventDefault();
          document.removeEventListener("click", sup, true);
        };
        document.addEventListener("click", sup, true);
        setTimeout(() => document.removeEventListener("click", sup, true), 0);
      }
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up, true);
  }, []);

  const sorted = useMemo(() => sortRoadmap(groups, msSort, issueSort), [groups, msSort, issueSort]);

  const filtered = useMemo(() => {
    if (filter === "all") return sorted;
    return sorted
      .map((g) => ({ ...g, bars: g.bars.filter((b) => b.state === filter) }))
      .filter((g) => g.bars.length > 0);
  }, [sorted, filter]);

  const { tStart, tEnd, totalDays } = useMemo(() => {
    const allBars = filtered.flatMap((g) => g.bars);
    if (!allBars.length) return { tStart: new Date(), tEnd: addDays(new Date(), 30), totalDays: 30 };
    const min = new Date(Math.min(...allBars.map((b) => b.start.getTime())));
    const max = new Date(
      Math.max(...allBars.map((b) => b.end.getTime()), ...filtered.map((g) => g.due?.getTime() || 0))
    );
    const s = addDays(min, -7);
    const e = addDays(max, 14);
    return { tStart: s, tEnd: e, totalDays: daysBetween(s, e) };
  }, [filtered]);

  const labelW = viewW && viewW < 560 ? 176 : LABEL_W;
  const avail = Math.max(viewW - labelW, 0);
  const fillW = avail > 0 ? Math.floor(avail / Math.max(totalDays, 1)) : 0;
  const dayW = Math.min(MAX_DAY_W, Math.max(ZOOM[zoom], fillW));
  const subMode = dayW >= 24 ? "day" : "week";
  const chartW = Math.max(totalDays * dayW, avail);

  // Ctrl/⌘ + wheel → zoom, anchored on the cursor.
  wheelRef.current = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const order = ["month", "week", "day"];
    const idx = order.indexOf(zoom);
    const nextIdx = e.deltaY < 0 ? Math.min(idx + 1, 2) : Math.max(idx - 1, 0);
    if (nextIdx === idx) return;
    const s = scrollerRef.current;
    if (!s) return;
    const localX = Math.max(e.clientX - s.getBoundingClientRect().left - labelW, 0);
    const dayAtCursor = (s.scrollLeft + localX) / dayW;
    const newDayW = Math.min(MAX_DAY_W, Math.max(ZOOM[order[nextIdx]], fillW));
    setZoom(order[nextIdx]);
    requestAnimationFrame(() => {
      if (scrollerRef.current) scrollerRef.current.scrollLeft = Math.max(0, dayAtCursor * newDayW - localX);
    });
  };

  const months = useMemo(() => {
    const out = [];
    const d = new Date(tStart);
    d.setDate(1);
    while (d <= tEnd) {
      const off = daysBetween(tStart, d);
      out.push({ label: fmtMonth(d, locale), off: Math.max(off, 0) });
      d.setMonth(d.getMonth() + 1);
    }
    return out;
  }, [tStart, tEnd, locale]);

  const weeks = useMemo(() => {
    const out = [];
    const d = new Date(tStart);
    d.setDate(d.getDate() - d.getDay() + 1);
    while (d <= tEnd) {
      const off = daysBetween(tStart, d);
      if (off >= 0) out.push({ off, label: fmtShort(d, locale) });
      d.setDate(d.getDate() + 7);
    }
    return out;
  }, [tStart, tEnd, locale]);

  const days = useMemo(() => {
    const out = [];
    const d = new Date(tStart);
    for (let off = 0; off <= totalDays; off++) {
      out.push({ off, dom: d.getDate(), dow: d.getDay() });
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, [tStart, totalDays]);

  const { vrows, posById } = useMemo(() => {
    const rows = [];
    const pos = {};
    let y = 0;
    filtered.forEach((g) => {
      const bStart = g.bars.length ? new Date(Math.min(...g.bars.map((b) => b.start.getTime()))) : null;
      const bEnd = g.due || (g.bars.length ? new Date(Math.max(...g.bars.map((b) => b.end.getTime()))) : null);
      rows.push({ type: "ms", group: g, top: y, span: { start: bStart, end: bEnd } });
      y += MS_ROW_H;
      if (!collapsed.has(g.id)) {
        g.bars.forEach((b) => {
          pos[b.id] = y;
          rows.push({ type: "bar", bar: b, color: g.color, top: y });
          y += ROW_H;
        });
      }
    });
    return { vrows: rows, posById: pos };
  }, [filtered, collapsed]);
  posRef.current = posById;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    for (const g of sorted) {
      for (const b of g.bars) {
        if (String(b.number).includes(q) || b.title.toLowerCase().includes(q)) {
          out.push({ g, b });
          if (out.length >= 8) return out;
        }
      }
    }
    return out;
  }, [sorted, query]);

  const todayOff = daysBetween(tStart, new Date());
  const todayInRange = todayOff >= 0 && todayOff <= totalDays;
  const allCollapsed = filtered.length > 0 && filtered.every((g) => collapsed.has(g.id));

  const toggle = (id) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAll = () => setCollapsed(allCollapsed ? new Set() : new Set(filtered.map((g) => g.id)));

  const ZORDER = ["month", "week", "day"];
  const zoomIn = () => setZoom(ZORDER[Math.min(ZORDER.indexOf(zoom) + 1, 2)]);
  const zoomOut = () => setZoom(ZORDER[Math.max(ZORDER.indexOf(zoom) - 1, 0)]);
  const zoomLabel = { month: t("roadmap.zoomMonth"), week: t("roadmap.zoomWeek"), day: t("roadmap.zoomDay") }[zoom];
  const ctrlBtn = { border: "none", background: "transparent", display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: "var(--r-sm)", color: "var(--ink)" };

  const onHover = useCallback((bar, e) => {
    setHovered(bar);
    setTip({ x: e.clientX, y: e.clientY });
  }, []);

  const scrollToToday = useCallback(() => {
    const s = scrollerRef.current;
    if (!s) return;
    s.scrollTo({ left: Math.max(0, todayOff * dayW - (s.clientWidth - labelW) / 2), behavior: "smooth" });
  }, [todayOff, dayW, labelW]);

  const centerOn = useCallback(
    (bar) => {
      const s = scrollerRef.current;
      if (!s) return;
      const startOff = daysBetween(tStart, bar.start);
      const dur = Math.max(daysBetween(bar.start, bar.end), 2);
      const left = Math.max(0, startOff * dayW + (dur * dayW) / 2 - (s.clientWidth - labelW) / 2);
      const top = Math.max(0, (posRef.current[bar.id] ?? 0) - (s.clientHeight - HEADER_H) / 2 + ROW_H / 2);
      s.scrollTo({ left, top, behavior: "smooth" });
      setActive(bar.id);
      clearTimeout(activeTimer.current);
      activeTimer.current = setTimeout(() => setActive(null), 1800);
    },
    [tStart, dayW, labelW]
  );

  // Jump from search: expand the milestone, then center the issue once rendered.
  const jumpTo = useCallback(
    (g, b) => {
      setCollapsed((prev) => {
        const n = new Set(prev);
        n.delete(g.id);
        return n;
      });
      setSearchOpen(false);
      setQuery("");
      setTimeout(() => centerOn(b), 90);
    },
    [centerOn]
  );

  useEffect(() => {
    if (initRef.current || !scrollerRef.current || viewW === 0 || !todayInRange) return;
    initRef.current = true;
    scrollerRef.current.scrollTo({ left: Math.max(0, todayOff * dayW - (viewW - labelW) / 2) });
  }, [viewW, todayOff, dayW, todayInRange, labelW]);

  // Close search dropdown on outside click.
  useEffect(() => {
    if (!searchOpen) return;
    const onDoc = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [searchOpen]);

  useEffect(() => {
    if (!sortOpen) return;
    const onDoc = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [sortOpen]);

  const rowBg = (id) => (active === id ? "var(--surface-strong)" : hovered?.id === id ? "var(--surface-soft)" : "transparent");

  return (
    <section
      id="roadmap"
      className={embedded ? undefined : "section"}
      style={embedded ? { display: "flex", flexDirection: "column", flex: 1, minHeight: 0 } : { paddingTop: "var(--s-xxl)" }}
    >
      <div className={embedded ? undefined : "container"} style={embedded ? { display: "flex", flexDirection: "column", flex: 1, minHeight: 0 } : undefined}>
        {/* Toolbar */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--s-sm)", flexWrap: "wrap", marginBottom: "var(--s-md)" }}>
          {/* Search / jump */}
          <div ref={searchRef} style={{ position: "relative" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex", pointerEvents: "none" }}>
                  <SearchIcon size={15} />
                </span>
                <input
                  className="input"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && matches[0]) jumpTo(matches[0].g, matches[0].b);
                    if (e.key === "Escape") setSearchOpen(false);
                  }}
                  placeholder={t("roadmap.search")}
                  style={{ height: 36, width: "min(240px, 56vw)", paddingLeft: 32, paddingRight: query ? 30 : 12, fontSize: 13 }}
                />
                {query && (
                  <button onClick={() => { setQuery(""); setSearchOpen(false); }} aria-label={t("form.close")} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer", display: "flex" }}>
                    <CloseIcon size={14} />
                  </button>
                )}
              </div>

              {searchOpen && query && (
                <div style={{ position: "absolute", top: 42, left: 0, zIndex: 60, width: 340, maxWidth: "80vw", background: "var(--canvas)", border: "1px solid var(--hairline)", borderRadius: "var(--r-md)", boxShadow: "0 16px 40px rgba(24,29,38,0.16)", overflow: "hidden", animation: "pop-in 0.14s ease" }}>
                  {matches.length === 0 ? (
                    <div style={{ padding: "12px 14px", fontSize: 13, color: "var(--muted)" }}>{t("roadmap.noResults")}</div>
                  ) : (
                    matches.map(({ g, b }) => (
                      <button
                        key={b.id}
                        onMouseDown={(e) => { e.preventDefault(); jumpTo(g, b); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "9px 12px", border: "none", borderTop: "1px solid var(--hairline)", background: "transparent", cursor: "pointer", fontFamily: "var(--font)" }}
                      >
                        <span style={{ display: "flex", flexShrink: 0, color: b.state === "closed" ? "var(--success)" : "var(--border-strong)" }}>
                          {b.state === "closed" ? <ClosedIcon size={15} /> : <OpenIcon size={15} />}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <span className="tnum" style={{ color: "var(--border-strong)", marginRight: 5 }}>#{b.number}</span>{b.title}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                            <span style={{ width: 7, height: 7, borderRadius: 2, background: g.color }} /> {g.title}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
          </div>

          <div className="segmented" role="group" aria-label="Filter">
            {[["all", t("roadmap.all")], ["open", t("roadmap.open")], ["closed", t("roadmap.closed")]].map(([k, label]) => (
              <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ position: "relative", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", overflow: "hidden", background: "var(--canvas)", ...(embedded ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } : {}) }}>
          {vrows.length === 0 ? (
            <div style={{ padding: "var(--s-section) var(--s-lg)", textAlign: "center", color: "var(--muted)" }}>{t("roadmap.empty")}</div>
          ) : (
            <div
              ref={setScrollEl}
              onMouseDown={startPan}
              style={{ overflow: "auto", cursor: grabbing ? "grabbing" : "grab", userSelect: "none", ...(embedded ? { flex: 1, minHeight: 0 } : { height: maxHeight }) }}
            >
              <div style={{ display: "flex", width: "max-content", minWidth: "100%", minHeight: "100%" }}>
                {/* ── Left column ── */}
                <div style={{ position: "sticky", left: 0, zIndex: 20, width: labelW, minWidth: labelW, flexShrink: 0, background: "var(--canvas)", borderRight: "1px solid var(--hairline)" }}>
                  <div style={{ height: HEADER_H, position: "sticky", top: 0, zIndex: 30, background: "var(--surface-soft)", borderBottom: "1px solid var(--hairline)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, padding: "0 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                      <button
                        onClick={toggleAll}
                        title={allCollapsed ? t("roadmap.expandAll") : t("roadmap.collapseAll")}
                        style={{ border: "none", background: "transparent", cursor: "pointer", display: "grid", placeItems: "center", width: 26, height: 26, borderRadius: "var(--r-sm)", color: "var(--muted)", flexShrink: 0 }}
                      >
                        {allCollapsed ? <ExpandAllIcon size={16} /> : <CollapseAllIcon size={16} />}
                      </button>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>{t("mt.milestone")}</span>
                    </div>
                    <div ref={sortRef} style={{ position: "relative" }}>
                      <button
                        onClick={() => setSortOpen((o) => !o)}
                        aria-expanded={sortOpen}
                        title={t("roadmap.sortMs")}
                        style={{ border: "none", background: sortOpen ? "var(--surface-strong)" : "transparent", cursor: "pointer", display: "grid", placeItems: "center", width: 26, height: 26, borderRadius: "var(--r-sm)", color: msSort !== "default" || issueSort !== "chrono" ? "var(--ink)" : "var(--muted)" }}
                      >
                        <SortIcon size={15} />
                      </button>
                      {sortOpen && (
                        <div style={{ position: "absolute", top: HEADER_H - 6, right: 0, zIndex: 50, width: 232, background: "var(--canvas)", border: "1px solid var(--hairline)", borderRadius: "var(--r-md)", boxShadow: "0 16px 40px rgba(24,29,38,0.16)", overflow: "hidden", textTransform: "none", animation: "pop-in 0.14s ease" }}>
                          <SortGroup label={t("roadmap.sortMs")} value={msSort} setValue={setMsSort} options={[["default", t("roadmap.sortDefault")], ["due", t("roadmap.sortDue")], ["name", t("roadmap.sortName")], ["progress", t("roadmap.sortProgress")]]} />
                          <div style={{ borderTop: "1px solid var(--hairline)" }} />
                          <SortGroup label={t("roadmap.sortIssues")} value={issueSort} setValue={setIssueSort} options={[["chrono", t("roadmap.sortChrono")], ["status", t("roadmap.sortStatus")], ["number", t("roadmap.sortNumber")]]} />
                        </div>
                      )}
                    </div>
                  </div>

                  {vrows.map((row) =>
                    row.type === "ms" ? (
                      <button
                        key={`l-ms-${row.group.id}`}
                        onClick={() => toggle(row.group.id)}
                        style={{ width: "100%", height: MS_ROW_H, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", background: "var(--surface-soft)", border: "none", borderBottom: "1px solid var(--hairline)", cursor: "pointer", textAlign: "left", fontFamily: "var(--font)" }}
                      >
                        <span style={{ color: "var(--muted)", display: "flex", flexShrink: 0 }}>
                          {collapsed.has(row.group.id) ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                        </span>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: row.group.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.group.title}</span>
                        {row.group.due && row.group.due < now && row.group.pct < 100 && (
                          <span title={t("roadmap.late")} style={{ display: "flex", color: TODAY, flexShrink: 0 }}>
                            <AlertIcon size={14} />
                          </span>
                        )}
                        <span className="tnum" style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>{row.group.closed}/{row.group.total}</span>
                      </button>
                    ) : (
                      <div
                        key={`l-b-${row.bar.id}`}
                        onClick={() => centerOn(row.bar)}
                        onMouseEnter={(e) => onHover(row.bar, e)}
                        onMouseLeave={() => setHovered(null)}
                        style={{ height: ROW_H, display: "flex", alignItems: "center", gap: 8, padding: "0 12px 0 30px", borderBottom: "1px solid var(--hairline)", cursor: "pointer", background: rowBg(row.bar.id) }}
                      >
                        <span style={{ display: "flex", flexShrink: 0, color: row.bar.state === "closed" ? "var(--success)" : "var(--border-strong)" }}>
                          {row.bar.state === "closed" ? <ClosedIcon size={15} /> : <OpenIcon size={15} />}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: row.bar.state === "closed" ? "var(--muted)" : "var(--body)", textDecoration: row.bar.state === "closed" ? "line-through" : "none" }}>
                          <span className="tnum" style={{ color: "var(--border-strong)", fontSize: 12, marginRight: 6 }}>#{row.bar.number}</span>
                          {row.bar.title}
                        </span>
                        <Avatar name={row.bar.author} url={row.bar.avatarUrl} size={20} />
                      </div>
                    )
                  )}
                </div>

                {/* ── Right chart ── */}
                <div style={{ width: chartW, flexShrink: 0, display: "flex", flexDirection: "column", minHeight: "100%" }}>
                  {/* Two-tier header */}
                  <div style={{ height: HEADER_H, flexShrink: 0, position: "sticky", top: 0, zIndex: 15, background: "var(--surface-soft)", borderBottom: "1px solid var(--hairline)" }}>
                    {/* months */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: MONTH_H, borderBottom: "1px solid var(--hairline)" }}>
                      {months.map((m, i) => (
                        <div key={i} style={{ position: "absolute", left: m.off * dayW, top: 0, height: "100%", display: "flex", alignItems: "center", paddingLeft: 8, fontSize: 11, fontWeight: 700, color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.05em", borderLeft: i ? "1px solid var(--hairline)" : "none", whiteSpace: "nowrap" }}>
                          {m.label}
                        </div>
                      ))}
                    </div>
                    {/* sub ticks: days or weeks */}
                    <div style={{ position: "absolute", top: MONTH_H, left: 0, right: 0, height: SUB_H }}>
                      {subMode === "day"
                        ? days.map((d) => {
                            const weekend = d.dow === 0 || d.dow === 6;
                            const isToday = d.off === todayOff;
                            return (
                              <div key={d.off} style={{ position: "absolute", left: d.off * dayW, top: 0, width: dayW, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: isToday ? 700 : 500, color: isToday ? "#fff" : weekend ? "var(--border-strong)" : "var(--muted)", background: isToday ? TODAY : "transparent", borderLeft: "1px solid var(--hairline)" }}>
                                {d.dom}
                              </div>
                            );
                          })
                        : weeks.map((w, i) => (
                            <div key={i} style={{ position: "absolute", left: w.off * dayW, top: 0, height: "100%", display: "flex", alignItems: "center", paddingLeft: 6, fontSize: 10, fontWeight: 500, color: "var(--muted)", borderLeft: "1px solid var(--hairline)", whiteSpace: "nowrap" }}>
                              {w.label}
                            </div>
                          ))}
                    </div>
                  </div>

                  {/* rows */}
                  <div style={{ position: "relative", flex: 1 }}>
                    {/* weekend shading (day zoom only) */}
                    {subMode === "day" &&
                      days
                        .filter((d) => d.dow === 0 || d.dow === 6)
                        .map((d) => (
                          <div key={`we-${d.off}`} style={{ position: "absolute", left: d.off * dayW, top: 0, bottom: 0, width: dayW, background: "var(--surface-soft)", opacity: 0.7 }} />
                        ))}

                    {/* week gridlines */}
                    {weeks.map((w, i) => (
                      <div key={i} style={{ position: "absolute", left: w.off * dayW, top: 0, bottom: 0, width: 1, background: "var(--hairline)", opacity: 0.5 }} />
                    ))}

                    {todayInRange && <div style={{ position: "absolute", left: todayOff * dayW, top: 0, bottom: 0, width: 2, background: TODAY, zIndex: 8 }} />}

                    {vrows.map((row) => {
                      if (row.type === "ms") {
                        const g = row.group;
                        const s = row.span;
                        const sOff = s.start ? daysBetween(tStart, s.start) : 0;
                        const eOff = s.end ? daysBetween(tStart, s.end) : sOff;
                        const bandLeft = sOff * dayW;
                        const bandW = Math.max((eOff - sOff) * dayW, 60);
                        const dueOff = g.due ? daysBetween(tStart, g.due) : null;
                        return (
                          <div key={`c-ms-${g.id}`} onClick={() => toggle(g.id)} style={{ height: MS_ROW_H, position: "relative", background: "var(--surface-soft)", borderBottom: "1px solid var(--hairline)", cursor: "pointer" }}>
                            <div
                              title={s.start && s.end ? `${fmtShort(s.start, locale)} – ${fmtShort(s.end, locale)}` : undefined}
                              style={{ position: "absolute", left: bandLeft, top: (MS_ROW_H - 28) / 2, width: bandW, height: 28, background: `${g.color}14`, border: `1px solid ${g.color}55`, borderRadius: "var(--r-sm)", overflow: "hidden", display: "flex", alignItems: "center", gap: 7, padding: "0 10px" }}
                            >
                              {/* progress fill */}
                              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${g.pct}%`, background: `${g.color}2b` }} />
                              <span style={{ position: "relative", width: 8, height: 8, borderRadius: 2, background: g.color, flexShrink: 0 }} />
                              <span style={{ position: "relative", fontSize: 12, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.title}</span>
                              <span className="tnum" style={{ position: "relative", marginLeft: "auto", fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>{g.pct}%</span>
                            </div>
                            {dueOff !== null && (
                              <div style={{ position: "absolute", left: dueOff * dayW + 8, top: MS_ROW_H / 2 - 9, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: g.color, whiteSpace: "nowrap" }}>
                                <DueIcon size={13} />
                                {fmtShort(g.due, locale)}
                              </div>
                            )}
                          </div>
                        );
                      }

                      const b = row.bar;
                      const startOff = daysBetween(tStart, b.start);
                      const dur = Math.max(daysBetween(b.start, b.end), 2);
                      const bLeft = startOff * dayW;
                      const bWidth = Math.max(dur * dayW, 24);
                      const isClosed = b.state === "closed";
                      const isActive = active === b.id;
                      const fg = isClosed ? "var(--muted)" : textOn(row.color);
                      const showText = bWidth > 78;

                      return (
                        <div key={`c-b-${b.id}`} onMouseEnter={(e) => onHover(b, e)} onMouseLeave={() => setHovered(null)} style={{ height: ROW_H, position: "relative", borderBottom: "1px solid var(--hairline)", background: rowBg(b.id) }}>
                          <button
                            onClick={() => (b.url ? window.open(b.url, "_blank") : centerOn(b))}
                            title={b.title}
                            style={{ position: "absolute", left: bLeft, top: (ROW_H - BAR_H) / 2, width: bWidth, height: BAR_H, borderRadius: 4, padding: "0 7px 0 5px", background: isClosed ? `${row.color}1a` : row.color, border: "none", boxShadow: isActive ? `0 0 0 2px var(--canvas), 0 0 0 3px ${row.color}` : "none", cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--font)" }}
                          >
                            <span style={{ display: "flex", flexShrink: 0, color: isClosed ? "var(--success)" : fg }}>
                              {isClosed ? <ClosedIcon size={11} /> : <OpenIcon size={11} />}
                            </span>
                            {showText && (
                              <span style={{ fontSize: 11, fontWeight: 500, color: fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: isClosed ? "line-through" : "none" }}>{b.title}</span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Floating zoom + today control (integrated into the chart) */}
          {vrows.length > 0 && (
            <div style={{ position: "absolute", right: 14, bottom: 16, zIndex: 40, display: "flex", alignItems: "center", gap: 2, background: "var(--canvas)", border: "1px solid var(--hairline)", borderRadius: "var(--r-md)", boxShadow: "0 6px 20px rgba(24,29,38,0.16)", padding: 3 }}>
              <button title={t("roadmap.today")} onClick={scrollToToday} disabled={!todayInRange} style={{ ...ctrlBtn, opacity: todayInRange ? 1 : 0.4, cursor: todayInRange ? "pointer" : "not-allowed" }}>
                <TodayIcon size={15} />
              </button>
              <span style={{ width: 1, height: 18, background: "var(--hairline)", margin: "0 3px" }} />
              <button title="Zoom −" onClick={zoomOut} disabled={zoom === "month"} style={{ ...ctrlBtn, opacity: zoom === "month" ? 0.4 : 1, cursor: zoom === "month" ? "not-allowed" : "pointer" }}>
                <MinusIcon size={15} />
              </button>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", minWidth: 56, textAlign: "center" }}>{zoomLabel}</span>
              <button title="Zoom +" onClick={zoomIn} disabled={zoom === "day"} style={{ ...ctrlBtn, opacity: zoom === "day" ? 0.4 : 1, cursor: zoom === "day" ? "not-allowed" : "pointer" }}>
                <PlusIcon size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div style={{ position: "fixed", left: Math.min(tip.x + 14, window.innerWidth - 360), top: tip.y + 18, background: "var(--canvas)", border: "1px solid var(--hairline)", borderRadius: "var(--r-md)", padding: "12px 14px", fontSize: 13, zIndex: 100, maxWidth: 340, pointerEvents: "none", boxShadow: "0 16px 40px rgba(24,29,38,0.14)", animation: "fade-in 0.12s ease" }}>
          <div style={{ fontWeight: 600, marginBottom: 4, lineHeight: 1.4, color: "var(--ink)" }}>
            <span className="tnum" style={{ color: "var(--border-strong)", fontSize: 12 }}>#{hovered.number}</span> {hovered.title}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>{fmtFull(hovered.start, locale)} – {fmtFull(hovered.end, locale)}</div>
          {hovered.author && (
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
              <Avatar name={hovered.author} url={hovered.avatarUrl} size={16} /> {t("roadmap.by")} {hovered.author}
            </div>
          )}
          <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: "var(--r-sm)", fontWeight: 600, background: hovered.state === "closed" ? "rgba(0,100,0,0.1)" : "rgba(27,97,201,0.1)", color: hovered.state === "closed" ? "var(--success)" : "var(--link)" }}>
              {hovered.state === "closed" ? t("roadmap.closedLabel") : t("roadmap.openLabel")}
            </span>
            {hovered.labels.map((l) => (
              <span key={l.id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: "var(--r-sm)", background: `#${l.color}22`, color: `#${l.color}`, border: `1px solid #${l.color}44` }}>{l.name}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SortGroup({ label, value, setValue, options }) {
  return (
    <div style={{ padding: "6px 0" }}>
      <div style={{ padding: "4px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>{label}</div>
      {options.map(([k, lbl]) => (
        <button
          key={k}
          onClick={() => setValue(k)}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "7px 12px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font)", fontSize: 13, color: value === k ? "var(--ink)" : "var(--body)", fontWeight: value === k ? 600 : 400 }}
        >
          <span style={{ width: 16, display: "flex", color: "var(--ink)" }}>{value === k && <CheckIcon size={14} />}</span>
          {lbl}
        </button>
      ))}
    </div>
  );
}
