import { CELL_FILL, CELL_R, CELL_SIZE, CELLS, SQUIRCLE_PATH } from "@/lib/brand";
import { envIcon } from "@/lib/env-badge";

export const dynamic = "force-static";

// Crisp, resolution-independent SVG favicon (referenced via metadata.icons in
// layout.tsx). The squircle colour tracks the build environment (see
// lib/env-badge); the mark geometry is the shared canonical spec so it matches
// the nav / apple / OG surfaces exactly.
export function GET() {
  const { bg } = envIcon();
  const cells = CELLS.map(
    (c) =>
      `<rect x="${c.x}" y="${c.y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="${CELL_R}" fill="${CELL_FILL}" opacity="${c.o}"/>`,
  ).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="${SQUIRCLE_PATH}" fill="${bg}"/>${cells}</svg>`;
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
