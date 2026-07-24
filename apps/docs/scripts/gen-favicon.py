#!/usr/bin/env python3
"""Generate public/favicon.ico (16+32+48) from the canonical brand mark.

The SVG favicon (app/brand/icon.svg) stays the primary tab icon; this ICO
exists for Google SERP + legacy fallbacks, where /favicon.ico is probed
directly.

Two rules the old size-tuned geometry broke:
  * FULL-BLEED background — the rounded square reaches the box edge so Google's
    circular SERP mask fills edge-to-edge with accent (no whitespace ring).
  * CANONICAL cell spacing — cells carry the same ~28% margin the brand mark
    gives them (lib/brand.ts: 32-unit box, cell 4, x = 9/14/19), so the climb
    never crowds the edge. The previous build sat the cells ~9% from the edge,
    which read as "touching". Proportions are derived from the brand spec so the
    ICO can't drift from the SVG / nav / OG surfaces.

Run: python3 scripts/gen-favicon.py   (from apps/docs)
"""

from PIL import Image, ImageDraw

EMBER = (194, 65, 12, 255)  # #c2410c — production accent (lib/env-badge.ts)
CELL = (250, 247, 241)  # #faf7f1 — lib/brand.ts CELL_FILL
OPACITIES = (0.4, 0.7, 1.0)
SS = 16  # supersample factor

# Canonical proportions from lib/brand.ts (32-unit box): cell 4, first cell at
# x=9, 5-unit diagonal step, cell corner 1.2, background corner ~6.
CELL_RATIO = 4 / 32  # 0.125
FIRST_RATIO = 9 / 32  # 0.28125 — symmetric ~28% margin
STEP_RATIO = 5 / 32  # 0.15625
CELL_R_RATIO = 1.2 / 4  # 0.30 of a cell
BG_R_RATIO = 6 / 32  # 0.1875 — iOS-style rounded square

SIZES = (16, 32, 48)


def draw_icon(size: int) -> Image.Image:
    cell = size * CELL_RATIO
    xs = [size * FIRST_RATIO + i * size * STEP_RATIO for i in range(3)]
    r = cell * CELL_R_RATIO
    bg_r = size * BG_R_RATIO
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Full-bleed rounded-square background (SERP chips mask to a circle; full
    # bleed keeps the accent edge-to-edge with no whitespace ring).
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=bg_r * SS, fill=EMBER)
    for x, o in zip(xs, OPACITIES):
        y = size - x - cell  # mirror: climb bottom-left -> top-right
        fill = (*CELL, round(255 * o))
        cell_img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        cd = ImageDraw.Draw(cell_img)
        cd.rounded_rectangle(
            [x * SS, y * SS, (x + cell) * SS - 1, (y + cell) * SS - 1],
            radius=r * SS,
            fill=fill,
        )
        img = Image.alpha_composite(img, cell_img)
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    icons = {size: draw_icon(size) for size in SIZES}
    out = "public/favicon.ico"
    icons[48].save(
        out,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[icons[16], icons[32]],
    )
    print(f"wrote {out}")
    # Preview PNGs for eyeballing (not shipped).
    for size, img in icons.items():
        img.save(f"/tmp/favicon-preview-{size}.png")


if __name__ == "__main__":
    main()
