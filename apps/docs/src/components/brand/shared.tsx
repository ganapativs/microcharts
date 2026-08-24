import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { Download } from "lucide-react";
import { CopyButton } from "@/components/ui/copy";
import { CELL_FILL, CELL_R, CELL_SIZE, CELLS, SQUIRCLE_PATH } from "@/lib/brand";

export type Tile = "light" | "dark" | "auto";

export type Asset = {
  file: string;
  name: string;
  note: string;
  tile: Tile;
  /** The raster of the same artwork, if one ships in public/brand/png. */
  png?: string;
  /** An adaptive file renders one of its two forms — whichever the reader's
   *  system asks for — so on a split ground half of it lands on the wrong
   *  paper. Naming the two static forms here previews both halves instead. */
  halves?: { light: string; dark: string };
};

export const ASSETS: Asset[] = [
  {
    file: "mark.svg",
    name: "Primary",
    note: "Cobalt squircle",
    tile: "light",
    png: "mark-1024.png",
  },
  {
    file: "mark-dark.svg",
    name: "Dark",
    note: "Dark-theme cobalt",
    tile: "dark",
    png: "mark-dark-512.png",
  },
  {
    file: "mark-adaptive.svg",
    name: "Adaptive",
    note: "Auto light / dark",
    tile: "auto",
    halves: { light: "mark.svg", dark: "mark-dark.svg" },
  },
  {
    file: "mark-mono-dark.svg",
    name: "Mono",
    note: "Dark ink · on light",
    tile: "light",
    png: "mark-mono-dark-512.png",
  },
  {
    file: "mark-mono-light.svg",
    name: "Mono",
    note: "Light ink · on dark",
    tile: "dark",
    png: "mark-mono-light-512.png",
  },
  { file: "mark-ember.svg", name: "Ember", note: "Warm accent", tile: "light" },
  { file: "mark-teal.svg", name: "Teal", note: "Cool accent", tile: "light" },
];

export const LOCKUPS: Asset[] = [
  {
    file: "lockup.svg",
    name: "Primary",
    note: "Cobalt mark · dark ink",
    tile: "light",
    png: "lockup-1600.png",
  },
  {
    file: "lockup-dark.svg",
    name: "Dark",
    note: "Dark-theme cobalt · light ink",
    tile: "dark",
    png: "lockup-dark-1600.png",
  },
  {
    file: "lockup-adaptive.svg",
    name: "Adaptive",
    note: "Auto light / dark",
    tile: "auto",
    halves: { light: "lockup.svg", dark: "lockup-dark.svg" },
  },
  { file: "lockup-mono-dark.svg", name: "Mono", note: "Dark ink · on light", tile: "light" },
  {
    file: "lockup-mono-light.svg",
    name: "Mono",
    note: "Light ink · on dark",
    tile: "dark",
    png: "lockup-mono-light-1600.png",
  },
];

export const WORDMARKS: Asset[] = [
  {
    file: "wordmark.svg",
    name: "Name",
    note: "Dark ink · on light",
    tile: "light",
    png: "wordmark-800.png",
  },
  {
    file: "wordmark-light.svg",
    name: "Name",
    note: "Light ink · on dark",
    tile: "dark",
    png: "wordmark-light-800.png",
  },
  {
    file: "wordmark-adaptive.svg",
    name: "Name",
    note: "Auto light / dark",
    tile: "auto",
    halves: { light: "wordmark.svg", dark: "wordmark-light.svg" },
  },
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

/** One downloadable file: the artwork on the ground it is drawn for, its name,
 *  and the three things a person came here to do — copy the source, take the
 *  SVG, take the PNG. Width and height are the artwork's own proportions; a
 *  lockup is a wide file and a mark is a square one. */
export function AssetTile({
  asset,
  width,
  height,
}: {
  asset: Asset;
  width: number;
  height: number;
}) {
  const { src, bytes } = readAsset(asset.file);
  return (
    <div className="plate flex flex-col overflow-hidden">
      <div className="bk-stage" data-tile={asset.tile}>
        <Image
          src={`/brand/${asset.halves ? asset.halves.light : asset.file}`}
          alt={`microcharts ${asset.name.toLowerCase()}, ${asset.note.toLowerCase()}`}
          width={width}
          height={height}
        />
        {asset.halves ? (
          // Masked with the same 135° line the ground is split on, so the two
          // forms meet exactly where the paper changes.
          <span aria-hidden className="bk-split">
            <Image src={`/brand/${asset.halves.dark}`} alt="" width={width} height={height} />
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2 px-3.5 pb-2.5 pt-3">
        <div className="min-w-0">
          <div
            className="truncate font-mono text-[13px] font-medium tracking-[-0.03em]"
            style={{ color: "var(--ink)" }}
          >
            {asset.name}
          </div>
          <div className="kicker mt-1.5 truncate">{asset.note}</div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <CopyButton text={src} size={8} analyticsKind="brand" />
          <a
            href={`/brand/${asset.file}`}
            download
            aria-label={`Download ${asset.file}`}
            className="ghost-ctrl size-8"
          >
            <Download className="size-4" />
          </a>
        </div>
      </div>
      <div
        className="mono-s flex items-center justify-between gap-3 px-3.5 pb-2.5"
        style={{ color: "var(--ink-3)" }}
      >
        <span className="truncate">{asset.file}</span>
        <span className="flex shrink-0 items-center gap-2 tabular-nums">
          <span>{(bytes / 1024).toFixed(1)} kB · svg</span>
          {asset.png ? (
            <a
              href={`/brand/png/${asset.png}`}
              download
              aria-label={`Download ${asset.png}`}
              className="ulink"
            >
              png
            </a>
          ) : null}
        </span>
      </div>
    </div>
  );
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
