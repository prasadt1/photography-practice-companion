#!/usr/bin/env python3
"""Intro / outro title slates on the branded ios-stage-bg (16:9)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
STAGE_BG = ROOT / "docs/demo-video-output/device-frame/ios-stage-bg.png"
STILLS = ROOT / "docs/devpost-public"
OUT = ROOT / "docs/demo-video-output/_work"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def _paste_contain(base: Image.Image, path: Path, box: tuple[int, int, int, int]) -> None:
    if not path.exists():
        return
    img = Image.open(path).convert("RGBA")
    bw, bh = box[2] - box[0], box[3] - box[1]
    img.thumbnail((bw, bh), Image.Resampling.LANCZOS)
    x = box[0] + (bw - img.width) // 2
    y = box[1] + (bh - img.height) // 2
    base.paste(img, (x, y), img)


def intro_slate() -> Path:
    base = Image.open(STAGE_BG).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(base)

    # Right-side hero copy (phone area stays visually open for next beat)
    draw.text(
        (1020, 340),
        "The mentor who\nremembers every frame",
        fill=(232, 224, 214),
        font=_font(56, bold=True),
        spacing=8,
    )
    draw.text(
        (1020, 500),
        "Live field coaching  ·  Glass Box critique\nMemory that persists across web and iPhone",
        fill=(180, 170, 158),
        font=_font(26),
        spacing=6,
    )

    badges = ["Gemini 3.1 Pro", "Glass Box", "MongoDB Atlas"]
    x = 1020
    for b in badges:
        f = _font(20)
        bbox = draw.textbbox((0, 0), b, font=f)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        pad = 14
        draw.rounded_rectangle(
            [x, 600, x + tw + pad * 2, 600 + th + pad * 2],
            radius=18,
            fill=(40, 36, 30),
            outline=(245, 166, 35),
            width=2,
        )
        draw.text((x + pad, 600 + pad - 2), b, fill=(255, 220, 170), font=f)
        x += tw + pad * 2 + 16

    path = OUT / "intro-stage-slate.png"
    base.save(path, quality=95)
    return path


def outro_slate() -> Path:
    base = Image.open(STAGE_BG).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(base)

    _paste_contain(base, STILLS / "iris-wordmark-tittle-light.png", (W // 2 - 200, 280, W // 2 + 200, 380))

    draw.text(
        (W // 2, 460),
        "Iris remembers every frame — and you stay in control.",
        fill=(232, 224, 214),
        font=_font(36, bold=True),
        anchor="mm",
    )
    draw.text(
        (W // 2, 540),
        "iris-photo-mentor.web.app",
        fill=(245, 166, 35),
        font=_font(32),
        anchor="mm",
    )

    path = OUT / "outro-stage-slate.png"
    base.save(path, quality=95)
    return path


if __name__ == "__main__":
    for p in (intro_slate(), outro_slate()):
        print(p)
