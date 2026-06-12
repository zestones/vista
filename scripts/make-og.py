#!/usr/bin/env python3
"""Generate the Vista social/OG banner (1200x630) in the brand language:
white canvas, dark-ink signature card holding a real Gantt (task-label column +
bars on a time grid with month ticks and a 'today' line). Editorial, sober —
matches public/icon.svg and DESIGN.md. Rendered at 2x, downsampled."""

from PIL import Image, ImageDraw, ImageFont

S = 2  # supersample factor
W, H = 1200 * S, 630 * S

INK = (24, 29, 38)        # #181d26
WHITE = (255, 255, 255)
MUTED = (95, 104, 116)    # secondary ink
HAIR = (230, 232, 235)    # hairline border
PEACH = (252, 171, 121)   # #fcab79
MINT = (168, 216, 196)    # #a8d8c4
YELLOW = (244, 211, 94)   # #f4d35e
CORAL = (170, 45, 0)      # #aa2d00 accent
STUB = (62, 70, 83)       # task-label stubs inside the ink card
GRID = (42, 49, 61)       # faint time gridlines
AXIS = (122, 131, 145)    # month-tick labels

ARIAL = "/usr/share/fonts/truetype/msttcorefonts/Arial.ttf"
ARIAL_BOLD = "/usr/share/fonts/truetype/msttcorefonts/Arial_Bold.ttf"


def font(path, px):
    return ImageFont.truetype(path, px * S)


img = Image.new("RGB", (W, H), WHITE)
d = ImageDraw.Draw(img)


def rr(box, radius, fill):
    d.rounded_rectangle([c * S for c in box], radius=radius * S, fill=fill)


# ---- outer hairline border (separates from white site backgrounds) ----
d.rectangle([0, 0, W - 1, H - 1], outline=HAIR, width=2 * S)

# ---- right: full-bleed ink signature card holding a Gantt ----
cx0, cy0, cx1, cy1 = 742, 56, 1144, 574
rr([cx0, cy0, cx1, cy1], 36, INK)

pad = 38
ix0, ix1 = cx0 + pad, cx1 - pad          # card inner span
tx0 = ix0 + 104                          # timeline starts after the label column
tx1 = ix1
track = tx1 - tx0

ax_f = font(ARIAL, 13)
months = ["Jun", "Jul", "Aug", "Sep"]
fracs = [0.06, 0.36, 0.66, 0.96]
hy = cy0 + pad                           # month labels baseline
chy0 = hy + 30                           # chart top
chy1 = cy1 - pad                         # chart bottom

# month ticks + descending gridlines
for m, fr in zip(months, fracs):
    x = tx0 + track * fr
    d.text((x * S, hy * S), m, font=ax_f, fill=AXIS)
    d.line([x * S, (chy0 - 6) * S, x * S, chy1 * S], fill=GRID, width=2 * S)

# rows: a task-label stub on the left, a colored bar on the timeline
rows = [
    (78, 0.00, 0.50, PEACH),
    (54, 0.12, 0.40, MINT),
    (70, 0.28, 0.46, YELLOW),
    (46, 0.04, 0.30, PEACH),
    (64, 0.34, 0.44, MINT),
    (58, 0.20, 0.58, YELLOW),
]
n = len(rows)
row_h = (chy1 - chy0) / n
bar_h = 20
stub_h = 9
for i, (sw, start, frac, col) in enumerate(rows):
    cy = chy0 + row_h * i + row_h / 2
    # task-label stub (left column)
    rr([ix0, cy - stub_h / 2, ix0 + sw, cy + stub_h / 2], stub_h / 2, STUB)
    # bar on the timeline
    bx0 = tx0 + track * start
    bx1 = bx0 + track * frac
    rr([bx0, cy - bar_h / 2, bx1, cy + bar_h / 2], bar_h / 2, col)

# "today" line + cap dot, in the coral accent
todx = tx0 + track * 0.60
d.line([todx * S, (chy0 - 10) * S, todx * S, (chy1 + 2) * S], fill=CORAL, width=2 * S)
d.ellipse([(todx - 4) * S, (chy0 - 14) * S, (todx + 4) * S, (chy0 - 6) * S], fill=CORAL)

# ---- left: brand lockup ----
mx = 80
T = 64
ty = 64
rr([mx, ty, mx + T, ty + T], 14, INK)
f = T / 512.0
for (rx, ry, rw, col) in [(120, 170, 272, PEACH), (120, 244, 200, MINT), (120, 318, 128, YELLOW)]:
    x0, y0 = mx + rx * f, ty + ry * f
    rr([x0, y0, x0 + rw * f, y0 + 48 * f], 24 * f, col)

word_f = font(ARIAL_BOLD, 38)
wb = word_f.getbbox("Vista")
wy = ty + (T - (wb[3] - wb[1])) / 2 / S - 6
d.text(((mx + T + 22) * S, wy * S), "Vista", font=word_f, fill=INK)

# ---- headline ----
hf = font(ARIAL_BOLD, 60)
lines = ["A shared product", "roadmap, built on", "your GitHub."]
hyl = 214
lh = 74
for i, ln in enumerate(lines):
    d.text((mx * S, (hyl + i * lh) * S), ln, font=hf, fill=INK)

# coral accent rule under the headline
ruy = hyl + len(lines) * lh + 6
rr([mx, ruy, mx + 64, ruy + 6], 3, CORAL)

# ---- sub copy (accurate: owner needs GitHub; clients do not) ----
sf = font(ARIAL, 23)
sub = [
    "Connect a GitHub repo. Vista turns its milestones and",
    "issues into a roadmap your clients follow — without a",
    "GitHub account of their own.",
]
syl = ruy + 30
slh = 33
for i, ln in enumerate(sub):
    d.text((mx * S, (syl + i * slh) * S), ln, font=sf, fill=MUTED)

out = img.resize((1200, 630), Image.LANCZOS)  # pyright: ignore[reportAttributeAccessIssue]
out.save("public/og.png", "PNG")
print("wrote public/og.png", out.size)
