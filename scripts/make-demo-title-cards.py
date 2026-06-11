#!/usr/bin/env python3
"""Rich intro/outro + architecture caption cards for demo video."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
STILLS = ROOT / "docs" / "devpost-public"
OUT = ROOT / "docs" / "demo-video-output" / "_work"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def _gradient(w: int, h: int) -> Image.Image:
    """Warm golden-hour gradient (top amber glow → deep slate)."""
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / h
        # amber highlight at top third, then slate
        r = int(42 + (180 - 42) * max(0, 1 - t * 2.2) ** 1.4)
        g = int(28 + (110 - 28) * max(0, 1 - t * 2.0) ** 1.3)
        b = int(22 + (55 - 22) * max(0, 1 - t * 2.5) ** 1.5)
        for x in range(w):
            px[x, y] = (r, g, b)
    return img


def _paste_contain(base: Image.Image, path: Path, box: tuple[int, int, int, int], radius: int = 0) -> None:
    if not path.exists():
        return
    img = Image.open(path).convert("RGBA")
    bw, bh = box[2] - box[0], box[3] - box[1]
    img.thumbnail((bw, bh), Image.Resampling.LANCZOS)
    x = box[0] + (bw - img.width) // 2
    y = box[1] + (bh - img.height) // 2
    if radius:
        mask = Image.new("L", img.size, 0)
        mdraw = ImageDraw.Draw(mask)
        mdraw.rounded_rectangle([0, 0, img.width, img.height], radius=radius, fill=255)
        base.paste(img, (x, y), mask)
    else:
        base.paste(img, (x, y), img)


def _badge(draw: ImageDraw.ImageDraw, x: int, y: int, text: str) -> None:
    pad_x, pad_y = 18, 10
    f = _font(22)
    bbox = draw.textbbox((0, 0), text, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    w, h = tw + pad_x * 2, th + pad_y * 2
    draw.rounded_rectangle([x, y, x + w, y + h], radius=20, fill=(55, 48, 40), outline=(255, 180, 100), width=2)
    draw.text((x + pad_x, y + pad_y - 2), text, fill=(255, 230, 190), font=f)


def intro_card() -> Path:
    base = _gradient(W, H)
    draw = ImageDraw.Draw(base)

    wordmark = STILLS / "iris-wordmark-tittle-light.png"
    _paste_contain(base, wordmark, (W // 2 - 280, 80, W // 2 + 280, 200))

    hero = STILLS / "iris-landing-hero.png"
    if hero.exists():
        hero_img = Image.open(hero).convert("RGBA")
        hero_img.thumbnail((920, 520), Image.Resampling.LANCZOS)
        # soft shadow plate
        plate = Image.new("RGBA", (hero_img.width + 48, hero_img.height + 48), (0, 0, 0, 0))
        pdraw = ImageDraw.Draw(plate)
        pdraw.rounded_rectangle([0, 0, plate.width, plate.height], radius=24, fill=(0, 0, 0, 90))
        hx = (W - hero_img.width) // 2
        hy = 240
        base.paste(plate, (hx - 24, hy - 24), plate)
        base.paste(hero_img, (hx, hy), hero_img)

    draw.text((W // 2, 820), "Iris — AI photography mentor", fill="white", font=_font(52, bold=True), anchor="mm")
    draw.text(
        (W // 2, 890),
        "Glass Box critique  ·  Live field coaching  ·  Memory that persists",
        fill=(220, 210, 195),
        font=_font(26),
        anchor="mm",
    )
    _badge(draw, W // 2 - 390, 960, "Gemini 3.1 Pro")
    _badge(draw, W // 2 - 110, 960, "Glass Box")
    _badge(draw, W // 2 + 140, 960, "MongoDB Atlas")
    path = OUT / "intro-card.png"
    base.save(path, quality=95)
    return path


def outro_card() -> Path:
    base = _gradient(W, H)
    draw = ImageDraw.Draw(base)
    draw.text((W // 2, H // 2 - 60), "iris-photo-mentor.web.app", fill="white", font=_font(48, bold=True), anchor="mm")
    draw.text((W // 2, H // 2 + 10), "Try it live", fill=(255, 210, 150), font=_font(30), anchor="mm")
    draw.text((W // 2, H // 2 + 70), "Built on Gemini  ·  Google Cloud  ·  MongoDB Atlas", fill=(200, 195, 185), font=_font(26), anchor="mm")
    path = OUT / "outro-card.png"
    base.save(path, quality=95)
    return path


def arch_card(image_name: str, title: str, subtitle: str, out_name: str) -> Path:
    """Architecture still with caption bar — keeps annotated panels readable."""
    src = STILLS / image_name
    base = _gradient(W, H)
    if src.exists():
        img = Image.open(src).convert("RGBA")
        # fit in upper area above caption bar
        max_w, max_h = W - 80, H - 200
        img.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
        x = (W - img.width) // 2
        y = 60 + (max_h - img.height) // 2
        shadow = Image.new("RGBA", (img.width + 32, img.height + 32), (0, 0, 0, 0))
        sdraw = ImageDraw.Draw(shadow)
        sdraw.rounded_rectangle([0, 0, shadow.width, shadow.height], radius=16, fill=(0, 0, 0, 100))
        base.paste(shadow, (x - 16, y - 16), shadow)
        base.paste(img, (x, y), img)

    draw = ImageDraw.Draw(base)
    bar_y = H - 130
    draw.rounded_rectangle([40, bar_y, W - 40, H - 40], radius=18, fill=(28, 24, 20), outline=(255, 180, 100), width=2)
    draw.text((72, bar_y + 22), title, fill="white", font=_font(34, bold=True))
    draw.text((72, bar_y + 68), subtitle, fill=(210, 200, 185), font=_font(24))
    path = OUT / out_name
    base.save(path, quality=95)
    return path


def all_arch_cards() -> list[Path]:
    return [
        arch_card(
            "diagram-architecture.png",
            "Nine agents · one orchestrator",
            "Gemini Live coach  ·  Cloud Run API  ·  MongoDB Atlas memory",
            "arch-01-diagram.png",
        ),
        arch_card(
            "annotated-02-glass-box.png",
            "Glass Box critique — inspectable AI",
            "Coach agent  ·  Agent Builder grounding  ·  scores persisted to Atlas",
            "arch-02-glassbox.png",
        ),
        arch_card(
            "proof-04-stack-health.png",
            "Shown at runtime — not just a diagram",
            "mentorMcpReads: enabled  ·  mongodbMcpHttp live on /health",
            "arch-03-proof.png",
        ),
    ]


if __name__ == "__main__":
    print(intro_card())
    print(outro_card())
    for p in all_arch_cards():
        print(p)
