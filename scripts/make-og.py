#!/usr/bin/env python3
"""Generate the Vista social/OG banner (1200x630) in the brand language:
white canvas, dark-ink signature card, the three-bar Gantt motif. Editorial,
sober — matches public/icon.svg and DESIGN.md. Rendered at 2x, downsampled."""

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
GRID = (44, 51, 63)       # faint lines inside the ink card

ARIAL = "/usr/share/fonts/truetype/msttcorefonts/Arial.ttf"
ARIAL_BOLD = "/usr/share/fonts/truetype/msttcorefonts/Arial_Bold.ttf"


def font(path, px):
    return ImageFont.truetype(path, px * S)


img = Image.new("RGB", (W, H), WHITE)
d = ImageDraw.Draw(img)


def rr(box, radius, fill):
    d.rounded_rectangle(box, radius=radius * S, fill=fill)


# ---- outer hairline border (separates from white site backgrounds) ----
d.rectangle([0, 0, W - 1, H - 1], outline=HAIR, width=2 * S)

# ---- right: full-bleed ink signature card with a mini-gantt ----
cx0, cy0, cx1, cy1 = 742, 56, 1144, 574
rr([cx0 * S, cy0 * S, cx1 * S, cy1 * S], 36, INK)

# faint vertical "time" gridlines inside the card
pad = 40
gx0, gx1 = cx0 + pad, cx1 - pad
gy0, gy1 = cy0 + pad + 16, cy1 - pad
for i in range(1, 5):
    x = gx0 + (gx1 - gx0) * i / 5
    d.line([x * S, (gy0 + 6) * S, x * S, gy1 * S], fill=GRID, width=2 * S)

# staggered gantt bars (start, width fractions across the card), cycling colors
bars = [
    (0.00, 0.78, PEACH),
    (0.14, 0.52, MINT),
    (0.30, 0.62, YELLOW),
    (0.08, 0.40, PEACH),
    (0.36, 0.50, MINT),
    (0.20, 0.70, YELLOW),
    (0.46, 0.38, PEACH),
]
bh = 26
span = gy1 - (gy0 + 6)
gap = (span - bh * len(bars)) / (len(bars) - 1)
track = gx1 - gx0
for i, (start, frac, col) in enumerate(bars):
    by = (gy0 + 6) + i * (bh + gap)
    bx0 = gx0 + track * start
    bx1 = bx0 + track * frac
    rr([bx0 * S, by * S, bx1 * S, (by + bh) * S], bh / 2, col)

# ---- left: brand lockup ----
mx = 80
# mark tile
T = 64
ty = 64
rr([mx * S, ty * S, (mx + T) * S, (ty + T) * S], 14, INK)
f = T / 512.0
for (rx, ry, rw, col) in [(120, 170, 272, PEACH), (120, 244, 200, MINT), (120, 318, 128, YELLOW)]:
    x0 = mx + rx * f
    y0 = ty + ry * f
    x1 = x0 + rw * f
    y1 = y0 + 48 * f
    rr([x0 * S, y0 * S, x1 * S, y1 * S], (24 * f), col)

# wordmark
word_f = font(ARIAL_BOLD, 38)
wy = ty + (T - (word_f.getbbox("Vista")[3] - word_f.getbbox("Vista")[1])) / 2 / S - 6
d.text(((mx + T + 22) * S, wy * S), "Vista", font=word_f, fill=INK)

# ---- headline ----
hf = font(ARIAL_BOLD, 60)
lines = ["A shared product", "roadmap, built on", "your GitHub."]
hy = 214
lh = 74
for i, ln in enumerate(lines):
    d.text((mx * S, (hy + i * lh) * S), ln, font=hf, fill=INK)

# coral accent rule under the headline
ry = hy + len(lines) * lh + 6
rr([mx * S, ry * S, (mx + 64) * S, (ry + 6) * S], 3, CORAL)

# ---- sub copy ----
sf = font(ARIAL, 23)
sub = [
    "Connect a private repo. Vista turns its milestones and",
    "issues into a roadmap your clients can follow — no GitHub",
    "access required.",
]
sy = ry + 30
slh = 33
for i, ln in enumerate(sub):
    d.text((mx * S, (sy + i * slh) * S), ln, font=sf, fill=MUTED)

# downsample for crisp antialiasing
out = img.resize((1200, 630), Image.LANCZOS)  # pyright: ignore[reportAttributeAccessIssue]
out.save("public/og.png", "PNG")
print("wrote public/og.png", out.size)
