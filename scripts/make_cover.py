#!/usr/bin/env python3
"""make_cover.py — draws the Neon Shores key-art cover procedurally with Pillow.

No image files, no external assets, nothing copied from any game: every shape is
computed here — a Vice City neon sunset over a shoreline, a neon-lit skyline, palm
silhouettes, a low sports car, two standing figures, and the title lettering set
in a bold system sans. Output: cover.png (1200x1600) beside the repository root.

Run:  python3 scripts/make_cover.py
"""

import math
import os
import random

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 1600
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Vice City palette: dusk purple up top melting into neon pink and sunset orange.
SKY = [(27, 8, 64), (88, 28, 135), (190, 40, 110), (255, 94, 98), (254, 180, 123)]
SUN_TOP = (255, 224, 138)
SUN_BOTTOM = (255, 46, 136)
SEA = (46, 16, 101)
SAND = (247, 160, 114)
DARK = (18, 6, 38)
NEON_PINK = (255, 46, 136)
NEON_CYAN = (34, 211, 238)
GOLD = (255, 217, 123)


def font(size, bold=True):
    """Best available bold sans on this machine; falls back to PIL's bitmap font."""
    names = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for path in names:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def vgrad(img, top, bottom, stops):
    """Vertical multi-stop gradient painted one scanline at a time."""
    d = ImageDraw.Draw(img)
    for y in range(top, bottom):
        t = y / max(1, bottom - top - 1) * (len(stops) - 1)
        i = min(len(stops) - 2, int(t))
        f = t - i
        c = tuple(int(stops[i][k] + (stops[i + 1][k] - stops[i][k]) * f) for k in range(3))
        d.line([(0, y), (img.width, y)], fill=c)


def palm(d, x, y, s, flip=1):
    """A palm silhouette: curved trunk plus a fan of drooping fronds."""
    pts = []
    for i in range(21):
        t = i / 20
        pts.append((x + flip * 46 * s * t * t, y - 190 * s * t))
    d.line(pts, fill=DARK, width=max(3, int(13 * s)))
    top = pts[-1]
    for k in range(7):
        a = math.pi * (0.06 + 0.88 * k / 6)
        ex = top[0] + flip * math.cos(a) * 105 * s
        ey = top[1] - math.sin(a) * 52 * s + 34 * s
        mid = (top[0] + flip * math.cos(a) * 62 * s, top[1] - math.sin(a) * 66 * s)
        frond = []
        for i in range(13):
            t = i / 12
            fx = (1 - t) ** 2 * top[0] + 2 * (1 - t) * t * mid[0] + t * t * ex
            fy = (1 - t) ** 2 * top[1] + 2 * (1 - t) * t * mid[1] + t * t * ey
            frond.append((fx, fy))
        d.line(frond, fill=DARK, width=max(2, int(7 * s)))
    d.ellipse([top[0] - 10 * s, top[1] - 4 * s, top[0] + 12 * s, top[1] + 16 * s], fill=DARK)


def building(d, rng, x, base, w, h):
    """One skyline block: dark slab, lit windows, sometimes a neon sign bar."""
    d.rectangle([x, base - h, x + w, base], fill=DARK)
    cols = max(2, int(w // 22))
    rows = max(3, int(h // 30))
    for c in range(cols):
        for r in range(rows):
            if rng.random() < 0.45:
                continue
            colour = NEON_CYAN if rng.random() < 0.15 else (255, 214, 140)
            wx = x + 7 + c * (w - 12) / cols
            wy = base - h + 10 + r * (h - 18) / rows
            d.rectangle([wx, wy, wx + 7, wy + 10], fill=colour)
    if rng.random() < 0.45:
        d.rectangle([x + 4, base - h + 14, x + min(w - 8, 52), base - h + 22],
                    fill=NEON_PINK if rng.random() < 0.5 else NEON_CYAN)


def sports_car(d, cx, ground, w):
    """Low wedge sports car in silhouette with neon underglow and rim wheels."""
    h = w * 0.22
    glow = Image.new("RGBA", (int(w * 1.2), int(h)), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([w * 0.08, h * 0.28, w * 1.12, h * 0.98], fill=NEON_PINK + (110,))
    return glow, (cx - w * 0.6, ground - h * 0.72)
    # (body drawn by caller after pasting the glow, so the glow sits under it)


def car_body(d, cx, ground, w):
    h = w * 0.22
    body = [
        (cx - w * 0.5, ground - h * 0.18), (cx - w * 0.42, ground - h * 0.55),
        (cx - w * 0.16, ground - h * 0.6), (cx - w * 0.05, ground - h * 0.95),
        (cx + w * 0.16, ground - h * 0.97), (cx + w * 0.3, ground - h * 0.62),
        (cx + w * 0.47, ground - h * 0.52), (cx + w * 0.5, ground - h * 0.18),
    ]
    d.polygon(body, fill=DARK)
    glass = [
        (cx - w * 0.03, ground - h * 0.88), (cx + w * 0.13, ground - h * 0.89),
        (cx + w * 0.24, ground - h * 0.64), (cx - w * 0.1, ground - h * 0.62),
    ]
    d.polygon(glass, fill=(140, 220, 255))
    for wx in (cx - w * 0.3, cx + w * 0.3):
        d.ellipse([wx - h * 0.17, ground - h * 0.33, wx + h * 0.17, ground + h * 0.01], fill=(10, 6, 24))
        d.ellipse([wx - h * 0.1, ground - h * 0.26, wx + h * 0.1, ground - h * 0.06], outline=NEON_CYAN, width=3)
    d.rectangle([cx + w * 0.44, ground - h * 0.44, cx + w * 0.5, ground - h * 0.35], fill=NEON_PINK)


def figures(d, cx, ground, s):
    """Two standing figures in flat silhouette — one with long hair, one capped."""
    def person(x, tall, hair):
        head_r = 16 * s * tall
        head_y = ground - 156 * s * tall
        d.ellipse([x - head_r, head_y - head_r, x + head_r, head_y + head_r], fill=DARK)
        if hair:
            d.rectangle([x - head_r, head_y - 2, x - head_r * 0.05, head_y + 62 * s], fill=DARK)
        else:
            d.rectangle([x - head_r * 1.35, head_y - head_r * 0.95, x + head_r * 1.35, head_y - head_r * 0.5], fill=DARK)
        d.polygon([
            (x - 34 * s, ground), (x - 25 * s, ground - 146 * s * tall),
            (x + 25 * s, ground - 146 * s * tall), (x + 35 * s, ground),
            (x + 11 * s, ground), (x + 6 * s, ground - 74 * s),
            (x - 7 * s, ground - 74 * s), (x - 12 * s, ground),
        ], fill=DARK)

    person(cx - 44 * s, 0.94, True)
    person(cx + 38 * s, 1.05, False)


def fit_font(draw, text, max_width, start_size):
    """Shrink a bold font until the text fits max_width; return (font, width)."""
    size = start_size
    while size > 12:
        f = font(size)
        box = draw.textbbox((0, 0), text, font=f)
        if box[2] - box[0] <= max_width:
            return f, box[2] - box[0]
        size -= 6
    f = font(size)
    box = draw.textbbox((0, 0), text, font=f)
    return f, box[2] - box[0]


def gradient_text(img, xy, text, f, stops, stroke=10):
    """Lettering filled with a vertical gradient, on a thick dark outline."""
    d = ImageDraw.Draw(img)
    x, y = xy
    for dx in range(-stroke, stroke + 1, max(1, stroke // 2)):
        for dy in range(-stroke, stroke + 1, max(1, stroke // 2)):
            if dx or dy:
                d.text((x + dx, y + dy), text, font=f, fill=(16, 3, 32))
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).text((x, y), text, font=f, fill=255)
    grad = Image.new("RGB", img.size)
    vgrad(grad, 0, img.height, stops)
    img.paste(grad, (0, 0), mask)


def build():
    rng = random.Random(20261119)
    img = Image.new("RGB", (W, H), SKY[0])
    horizon = int(H * 0.6)

    # Sky, then the sun disc with retro slice gaps over the horizon.
    vgrad(img, 0, horizon + 2, SKY)
    d = ImageDraw.Draw(img, "RGBA")
    sun_r = 300
    sun = Image.new("RGB", (sun_r * 2, sun_r * 2))
    vgrad(sun, 0, sun_r * 2, [SUN_TOP, (255, 140, 90), SUN_BOTTOM])
    disc_mask = Image.new("L", (sun_r * 2, sun_r * 2), 0)
    ImageDraw.Draw(disc_mask).ellipse([0, 0, sun_r * 2, sun_r * 2], fill=255)
    img.paste(sun, (W // 2 - sun_r, horizon - sun_r - 60), disc_mask)
    d = ImageDraw.Draw(img, "RGBA")
    for i in range(5):
        gy = horizon - 60 + i * 34 + i * i * 3
        d.rectangle([W // 2 - sun_r, gy, W // 2 + sun_r, gy + 5 + i * 3], fill=(24, 6, 46, 150))

    # Sea with a broken golden reflection column, then the sand strip.
    d.rectangle([0, horizon, W, H], fill=SEA)
    for _ in range(90):
        ry = rng.randint(horizon + 8, H - 30)
        spread = int(340 * (1 - (ry - horizon) / (H - horizon)) + 30)
        rx = W // 2 + rng.randint(-spread, spread)
        d.rectangle([rx, ry, rx + rng.randint(18, 90), ry + 3], fill=(255, 190, 120, 130))
    d.polygon([(0, H), (0, horizon + 190), (W * 0.45, horizon + 120),
               (W, horizon + 210), (W, H)], fill=SAND)

    # Skyline along the left horizon, palms framing both sides.
    bx = -8
    while bx < W * 0.38:
        bw = rng.randint(46, 96)
        building(d, rng, bx, horizon + 6, bw, rng.randint(150, 330))
        bx += bw + 8
    palm(d, 58, H - 100, 0.95, 1)
    palm(d, W - 120, H - 90, 1.25, -1)

    # The car centre stage on the sand, the duo standing beside it.
    glow, (gx, gy) = sports_car(d, W * 0.58, H - 150, 620)
    img.paste(glow, (int(gx), int(gy)), glow)
    d = ImageDraw.Draw(img, "RGBA")
    car_body(d, W * 0.58, H - 150, 620)
    figures(d, W * 0.2, H - 96, 1.5)

    # Bottom shade so the caption strip reads, plus a whisper of film grain.
    for i in range(190):
        d.rectangle([0, H - 190 + i, W, H - 189 + i], fill=(6, 1, 16, int(150 * i / 190)))
    noise = Image.effect_noise((W, H), 16)
    img = Image.blend(img, Image.merge("RGB", (noise, noise, noise)), 0.05)
    d = ImageDraw.Draw(img, "RGBA")

    # --- Lettering: the brief's title, set by hand, gradient-filled. ---
    f_title, tw = fit_font(d, "GRAND THEFT AUTO", W - 120, 118)
    gradient_text(img, ((W - tw) // 2, 54), "GRAND THEFT AUTO", f_title,
                  [(255, 255, 255), GOLD, NEON_PINK], stroke=9)
    d = ImageDraw.Draw(img, "RGBA")
    f_vi, vw = fit_font(d, "VI", 420, 300)
    gradient_text(img, ((W - vw) // 2, 168), "VI", f_vi,
                  [(255, 255, 255), (255, 160, 200), NEON_PINK], stroke=12)
    d = ImageDraw.Draw(img, "RGBA")

    # Neon accent under the numeral, and the bottom caption strip.
    f_vice, ww = fit_font(d, "VICE CITY", 560, 84)
    d.text(((W - ww) // 2, 512), "VICE CITY", font=f_vice, fill=NEON_CYAN,
           stroke_width=3, stroke_fill=(10, 30, 50))
    d.rectangle([0, H - 108, W, H], fill=(8, 2, 20, 235))
    d.rectangle([0, H - 108, W, H - 102], fill=NEON_PINK)
    f_cap = font(44)
    d.text((42, H - 82), "NEON SHORES · KEY ART EDITION", font=f_cap, fill=(255, 255, 255))
    f_small = font(30, bold=False)
    d.text((42, H - 40), "Drawn procedurally with Pillow — no external assets", font=f_small,
           fill=(200, 190, 230))

    out = os.path.join(ROOT, "cover.png")
    img.save(out)
    print(f"wrote {out} ({img.width}x{img.height})")


if __name__ == "__main__":
    build()
