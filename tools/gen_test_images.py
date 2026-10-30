"""Generate distinct test images with varied aspect ratios + visible geometry."""
import os
import math
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "..", ".build", "testimg")
os.makedirs(OUT, exist_ok=True)

FONT = "C:/Windows/Fonts/segoeuib.ttf"


def font(sz):
    try:
        return ImageFont.truetype(FONT, sz)
    except Exception:
        return ImageFont.load_default()


SPECS = [
    ("A.png", 1600, 1200, (255, 122, 61), (196, 32, 96)),
    ("B.png", 900, 1600, (56, 189, 248), (37, 99, 235)),
    ("C.png", 1200, 1200, (52, 211, 153), (5, 150, 105)),
    ("D.png", 2000, 800, (167, 139, 250), (124, 58, 237)),
    ("E.png", 1400, 900, (251, 191, 36), (217, 70, 239)),
    ("F.png", 1000, 1500, (248, 113, 113), (30, 41, 59)),
]


def make(name, w, h, c1, c2, letter):
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        d.line(
            [(0, y), (w, y)],
            fill=(
                int(c1[0] + (c2[0] - c1[0]) * t),
                int(c1[1] + (c2[1] - c1[1]) * t),
                int(c1[2] + (c2[2] - c1[2]) * t),
            ),
        )
    # geometry so crops/zoom are obvious
    step = max(48, min(w, h) // 8)
    for x in range(0, w, step):
        d.line([(x, 0), (x, h)], fill=(255, 255, 255, 20), width=2)
    for y in range(0, h, step):
        d.line([(0, y), (w, y)], fill=(255, 255, 255, 20), width=2)
    r = min(w, h) * 0.22
    d.ellipse([w * 0.5 - r, h * 0.5 - r, w * 0.5 + r, h * 0.5 + r],
              outline=(255, 255, 255), width=max(3, int(min(w, h) * 0.012)))
    # corner markers
    m = min(w, h) * 0.05
    for (cx, cy) in [(m, m), (w - m, m), (m, h - m), (w - m, h - m)]:
        d.ellipse([cx - m * 0.35, cy - m * 0.35, cx + m * 0.35, cy + m * 0.35],
                  fill=(255, 255, 255))
    f = font(int(min(w, h) * 0.42))
    tb = d.textbbox((0, 0), letter, font=f)
    d.text((w / 2 - (tb[2] - tb[0]) / 2 - tb[0], h / 2 - (tb[3] - tb[1]) / 2 - tb[1]),
           letter, font=f, fill=(255, 255, 255))
    f2 = font(max(14, int(min(w, h) * 0.045)))
    d.text((m * 1.4, h - m * 1.4), f"{w}x{h}", font=f2, fill=(255, 255, 255))
    img.save(os.path.join(OUT, name), optimize=True)
    print(name, w, h)


for i, (name, w, h, c1, c2) in enumerate(SPECS):
    make(name, w, h, c1, c2, "ABCDEF"[i])
