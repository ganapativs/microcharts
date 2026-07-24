import { CELL_FILL, CELL_R, CELL_SIZE, CELLS, SQUIRCLE_PATH } from "@/lib/brand";
import { envIcon } from "@/lib/env-badge";

export const dynamic = "force-static";

// Crisp, resolution-independent SVG favicon (referenced via metadata.icons in
// layout.tsx). The squircle colour tracks the build environment (see
// lib/env-badge); the cell geometry is the shared canonical spec so it matches
// the nav / apple / OG surfaces exactly.
//
// The canonical squircle is inset (~2.4u of transparent margin inside the
// 32u box) — correct for the nav mark, wrong for a favicon: a browser tab or
// Google's circular SERP chip then shows the squircle floating with a
// whitespace ring. Here the squircle is scaled about centre to bleed to the box
// edge (16/13.6 ≈ 1.176), so the accent fills the tab / circle edge-to-edge
// while the cells keep their canonical ~28% margin and never touch the edge.
const BLEED = 16 / 13.6; // canonical squircle half-extent 13.6u → full 16u

export function GET() {
  const { bg } = envIcon();
  const cells = CELLS.map(
    (c) =>
      `<rect x="${c.x}" y="${c.y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="${CELL_R}" fill="${CELL_FILL}" opacity="${c.o}"/>`,
  ).join("");
  const squircle = `<g transform="translate(16 16) scale(${BLEED.toFixed(4)}) translate(-16 -16)"><path d="${SQUIRCLE_PATH}" fill="${bg}"/></g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${squircle}${cells}</svg>`;
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
