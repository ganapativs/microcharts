import fs from "node:fs";
import path from "node:path";
import { CELL_FILL, CELL_R, CELL_SIZE, CELLS, SQUIRCLE_PATH } from "@/lib/brand";

export type Tile = "light" | "dark" | "auto";

export const ASSETS: { file: string; name: string; note: string; tile: Tile }[] = [
  { file: "mark.svg", name: "Primary", note: "Cobalt squircle", tile: "light" },
  { file: "mark-adaptive.svg", name: "Adaptive", note: "Auto light / dark", tile: "auto" },
  { file: "mark-mono-dark.svg", name: "Mono", note: "Dark ink · on light", tile: "light" },
  { file: "mark-mono-light.svg", name: "Mono", note: "Light ink · on dark", tile: "dark" },
  { file: "mark-ember.svg", name: "Ember", note: "Warm accent", tile: "light" },
  { file: "mark-teal.svg", name: "Teal", note: "Cool accent", tile: "light" },
];

export const ACCENTS: { name: string; light: string; dark: string }[] = [
  { name: "Cobalt", light: "#2f52d4", dark: "#528dff" },
  { name: "Ember", light: "#c2410c", dark: "#f7924e" },
  { name: "Clay", light: "#a14a34", dark: "#e08e73" },
  { name: "Moss", light: "#4d7c1e", dark: "#a3c46a" },
  { name: "Teal", light: "#0f766e", dark: "#55c2b3" },
  { name: "Rose", light: "#be123c", dark: "#fb6f89" },
];

export const SPECS: [string, string][] = [
  ["Container", "Superellipse · n 4.5"],
  ["Cells", "Three · graded fill"],
  ["Grid", "32 × 32 units"],
  ["Encoding", "Weight = value"],
];

export function readAsset(file: string): { src: string; bytes: number } {
  const p = path.join(process.cwd(), "public", "brand", file);
  const src = fs.readFileSync(p, "utf8");
  return { src, bytes: Buffer.byteLength(src, "utf8") };
}

/* There is no `SectionMark`. Every section on this page used to open with a mono
   label above its heading — "The mark", "Logo variants", "Color", "Type" — and
   every one of them restated the heading directly under it. It also is not how
   this surface works: the landing page spends `.kicker` on captions and data
   labels (a figcaption, a table header, a plate's count) and never once sets one
   above a heading. Eight of them on one page is the templated rhythm that makes
   a page read as generated. The headings say what the sections are. */

export function markInner(fill: string, cellFill = CELL_FILL, cellOpacity = true) {
  return (
    <>
      <path d={SQUIRCLE_PATH} fill={fill} />
      {CELLS.map((c) => (
        <rect
          key={c.x}
          x={c.x}
          y={c.y}
          width={CELL_SIZE}
          height={CELL_SIZE}
          rx={CELL_R}
          fill={cellFill}
          opacity={cellOpacity ? c.o : 1}
        />
      ))}
    </>
  );
}
