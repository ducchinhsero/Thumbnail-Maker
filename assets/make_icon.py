"""Generate the app icon (multi-size .ico) — brand: gradient squircle + collage glyph."""
from PIL import Image, ImageDraw

S = 1024
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

# ── gradient background inside a rounded squircle ─────────────────────────
grad = Image.new("RGBA", (S, S))
gd = ImageDraw.Draw(grad)
c1 = (139, 120, 255)   # violet
c2 = (58, 132, 255)    # blue
for y in range(S):
    t = y / (S - 1)
    # diagonal-ish blend
    r = int(c1[0] + (c2[0] - c1[0]) * (t ** 0.85))
    g = int(c1[1] + (c2[1] - c1[1]) * (t ** 0.85))
    b = int(c1[2] + (c2[2] - c1[2]) * (t ** 0.85))
    gd.line([(0, y), (S, y)], fill=(r, g, b, 255))

mask = Image.new("L", (S, S), 0)
md = ImageDraw.Draw(mask)
md.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.235), fill=255)
img.paste(grad, (0, 0), mask)

# subtle top sheen
sheen = Image.new("RGBA", (S, S), (0, 0, 0, 0))
sd = ImageDraw.Draw(sheen)
for i in range(int(S * 0.5)):
    a = int(34 * (1 - i / (S * 0.5)) ** 2)
    sd.line([(0, i), (S, i)], fill=(255, 255, 255, a))
img = Image.alpha_composite(img, Image.composite(sheen, Image.new("RGBA", (S, S), (0, 0, 0, 0)), mask))

# ── collage glyph (big left card + 3 stacked) ─────────────────────────────
d = ImageDraw.Draw(img)
m = int(S * 0.175)          # margin
w, h = S - m * 2, S - m * 2
gap = int(S * 0.052)
rad = int(S * 0.048)

big_w = int(w * 0.52)
# big card (left)
d.rounded_rectangle([m, m, m + big_w, m + h], radius=rad, fill=(255, 255, 255, 255))
# right column: 3 stacked cards
rx = m + big_w + gap
rw = w - big_w - gap
ch = (h - gap * 2) // 3
alphas = (200, 140, 92)
for i, a in enumerate(alphas):
    y0 = m + i * (ch + gap)
    d.rounded_rectangle([rx, y0, rx + rw, y0 + ch], radius=int(rad * 0.85), fill=(255, 255, 255, a))

img.save("assets/app.ico", format="ICO",
         sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (40, 40), (32, 32), (24, 24), (20, 20), (16, 16)])
img.resize((512, 512), Image.LANCZOS).save("assets/app.png")
print("icon ok")
