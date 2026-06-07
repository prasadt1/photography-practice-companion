#!/usr/bin/env python3
"""Replace old eye-aperture SVG in docs/index.html with current Iris windmill mark."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "docs" / "index.html"

SVG_START = (
    '<svg viewBox=\\"0 0 100 100\\" fill=\\"none\\" stroke=\\"#d97706\\" '
    'stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" width=\\"34\\" height=\\"34\\" '
    'aria-hidden=\\"true\\" class=\\"iris-focus-spin\\">'
)
SVG_END = "<\\u002Fsvg>"

NEW_MARK = (
    '<svg viewBox=\\"0 0 100 100\\" fill=\\"none\\" xmlns=\\"http://www.w3.org/2000/svg\\" '
    'width=\\"34\\" height=\\"34\\" aria-hidden=\\"true\\" class=\\"iris-focus-spin\\">'
    '<circle cx=\\"50\\" cy=\\"50\\" r=\\"46\\" stroke=\\"#d97706\\" stroke-width=\\"3.6\\"/>'
    '<line x1=\\"76\\" y1=\\"50\\" x2=\\"76\\" y2=\\"87.95\\" stroke=\\"#d97706\\" '
    'stroke-width=\\"4.6\\" stroke-linecap=\\"round\\"/>'
    '<line x1=\\"63\\" y1=\\"72.52\\" x2=\\"30.14\\" y2=\\"91.49\\" stroke=\\"#d97706\\" '
    'stroke-width=\\"4.6\\" stroke-linecap=\\"round\\"/>'
    '<line x1=\\"37\\" y1=\\"72.52\\" x2=\\"4.14\\" y2=\\"53.54\\" stroke=\\"#d97706\\" '
    'stroke-width=\\"4.6\\" stroke-linecap=\\"round\\"/>'
    '<line x1=\\"24\\" y1=\\"50\\" x2=\\"24\\" y2=\\"12.05\\" stroke=\\"#d97706\\" '
    'stroke-width=\\"4.6\\" stroke-linecap=\\"round\\"/>'
    '<line x1=\\"37\\" y1=\\"27.48\\" x2=\\"69.86\\" y2=\\"8.51\\" stroke=\\"#d97706\\" '
    'stroke-width=\\"4.6\\" stroke-linecap=\\"round\\"/>'
    '<line x1=\\"63\\" y1=\\"27.48\\" x2=\\"95.86\\" y2=\\"46.46\\" stroke=\\"#d97706\\" '
    'stroke-width=\\"4.6\\" stroke-linecap=\\"round\\"/>'
    '<circle cx=\\"50\\" cy=\\"50\\" r=\\"26\\" stroke=\\"#d97706\\" stroke-width=\\"3.6\\"/>'
    '<circle cx=\\"50\\" cy=\\"50\\" r=\\"14\\" fill=\\"#1a1816\\" stroke=\\"#fbbf24\\" '
    'stroke-width=\\"2.8\\"/>'
    '<circle cx=\\"45.52\\" cy=\\"45.52\\" r=\\"3.5\\" fill=\\"#fbbf24\\"/>'
    "<\\u002Fsvg>"
)


def main() -> None:
    if not INDEX.is_file():
        print(f"ERROR: {INDEX} not found", file=sys.stderr)
        sys.exit(1)

    text = INDEX.read_text(encoding="utf-8")
    if SVG_START not in text:
        if "M18 50 C31 29" not in text:
            print("No old logo found — already up to date.")
            return
        print("ERROR: old logo path found but start marker missing", file=sys.stderr)
        sys.exit(1)

    count = 0
    while SVG_START in text:
        start = text.index(SVG_START)
        end = text.index(SVG_END, start) + len(SVG_END)
        text = text[:start] + NEW_MARK + text[end:]
        count += 1

    INDEX.write_text(text, encoding="utf-8")
    print(f"Patched {count} logo(s) in {INDEX.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
