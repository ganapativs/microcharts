#!/usr/bin/env python3
"""Generate src/app/favicon.ico (16+32+48) from the canonical brand mark.

The SVG favicon (app/brand/icon.svg) stays the primary tab icon; this ICO
exists for Google SERP + legacy fallbacks, where /favicon.ico is probed
directly. Cells are size-tuned (bolder than the 32-unit spec) so the climbing
mark survives 16 px — a straight downscale of the canonical geometry reads as
noise at SERP size.

Run: python3 scripts/gen-favicon.py   (from apps/docs)
"""

from PIL import Image, ImageDraw

EMBER = (194, 65, 12, 255)  # #c2410c — production accent (lib/env-badge.ts)
CELL = (250, 247, 241)  # #faf7f1 — lib/brand.ts CELL_FILL
OPACITIES = (0.4, 0.7, 1.0)
SS = 16  # supersample factor

# Per-size tuned geometry: (cell_px, [x positions], corner_radius, bg_radius)
# y positions mirror x (bottom-left -> top-right climb).
TUNED = {
    16: (4.0, [1.5, 6.0, 10.5], 1.2, 3.0),
    32: (7.0, [3.0, 12.5, 22.0], 2.2, 6.0),
    48: (10.0, [5.0, 19.0, 33.0], 3.2, 9.0),
}


def draw_icon(size: int) -> Image.Image:
    cell, xs, r, bg_r = TUNED[size]
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Full-bleed rounded-square background (SERP chips mask to a circle anyway;
    # full bleed keeps the mark as large as possible).
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
    icons = {size: draw_icon(size) for size in TUNED}
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
