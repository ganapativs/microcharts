/**
 * Every brand file's source, built from the canonical geometry.
 *
 * The mark comes from `brand.ts`, the name from `wordmark.ts` (outlined by
 * `scripts/gen-wordmark-path.py`). `scripts/gen-brand-kit.mjs` writes what is
 * here to `public/brand/`, rasterizes the PNGs, and zips the kit;
 * `brand-assets.test.ts` fails if what's on disk has drifted from this file.
 * Nothing here touches node — the test and the site can both import it.
 */
// Explicit .ts extensions (tsconfig allows them): the generator script runs
// this module straight through node's type stripping, which won't resolve an
// extensionless specifier the way a bundler does.
import { CELL_FILL, CELL_R, CELL_SIZE, CELLS, SQUIRCLE_PATH } from "./brand.ts";
import { WORDMARK_EM, WORDMARK_INK, WORDMARK_PATH } from "./wordmark.ts";

export const COBALT = { light: "#2f52d4", dark: "#528dff" };
const EMBER = { light: "#c2410c", dark: "#f7924e" };
const CLAY = { light: "#a14a34", dark: "#e08e73" };
const MOSS = { light: "#4d7c1e", dark: "#a3c46a" };
const TEAL = { light: "#0f766e", dark: "#55c2b3" };
const ROSE = { light: "#be123c", dark: "#fb6f89" };
/** "dark" is dark ink, for light grounds — the naming the files already use.
 *  Both values are the site's text inks (`--color-fd-foreground` per theme),
 *  so the wordmark is set in the ink the product reads in. */
const INK = { dark: "#12151d", light: "#e9e8e3" };
/** The grounds the site paints: `--color-fd-background` in each theme, and
 *  the two `themeColor` entries. A designer rebuilding the brand from
 *  colors.json has to land on the same field the product uses. */
const PAPER = { light: "#e9edf4", dark: "#0a0b0f" };

export const BRAND_COLORS = {
  /** The site picker's six accents, in its order. Cobalt, ember and teal also
   *  ship as mark files; the other three recolor chrome only. */
  accent: { cobalt: COBALT, ember: EMBER, clay: CLAY, moss: MOSS, teal: TEAL, rose: ROSE },
  cell: CELL_FILL,
  ink: { light: INK.dark, dark: INK.light },
  paper: PAPER,
  /** The valence pair as the brand page shows it — the docs surface's deepened
   *  cut of the library's own defaults (those live in styles.css). Positive and
   *  negative keep these hues under every accent and preset. */
  semantic: {
    positive: { light: "#077353", dark: "#45a385" },
    negative: { light: "#ad4713", dark: "#df7856" },
  },
};

// ── the mark ───────────────────────────────────────────────────────────────

const GRADE = CELLS.map((c) => c.o);
/** Mono lifts the grade: 0.4 of a single ink on paper is fainter than 0.4 of
 *  near-white on saturated cobalt. */
const MONO_GRADE = [0.45, 0.72, 1];

const cells = (fill: string, opacities: readonly number[]) =>
  CELLS.map(
    (c, i) =>
      `<rect x="${c.x}" y="${c.y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="${CELL_R}" fill="${fill}"${
        opacities[i] === 1 ? "" : ` opacity="${opacities[i]}"`
      }/>`,
  );

type Paint = { accent?: string; mono?: string; adaptive?: boolean };

/** The mark's elements at its own 32-unit scale; the caller indents them. An
 *  adaptive file carries `class="sq"` so one <style> repaints the squircle, and
 *  still names a fill inline: CSS outranks a presentation attribute, so the
 *  media query keeps working, and the file survives a host that strips <style>
 *  out of an SVG (GitHub does) instead of going black. */
function markParts({ accent, mono, adaptive }: Paint) {
  const squircle = mono
    ? `<path d="${SQUIRCLE_PATH}" fill="none" stroke="${mono}" stroke-width="1.6"/>`
    : `<path${adaptive ? ' class="sq"' : ""} d="${SQUIRCLE_PATH}" fill="${adaptive ? COBALT.light : accent}"/>`;
  return [squircle, ...(mono ? cells(mono, MONO_GRADE) : cells(CELL_FILL, GRADE))];
}

const style = (rules: string[]) =>
  `  <style>\n${rules.map((r) => `    ${r}`).join("\n")}\n  </style>\n`;

const file = (o: {
  w: number;
  h: number;
  viewBox: string;
  title: string;
  style?: string;
  body: string;
}) => `<svg xmlns="http://www.w3.org/2000/svg" width="${o.w}" height="${o.h}" viewBox="${o.viewBox}">
  <title>${o.title}</title>
${o.style ?? ""}  ${o.body}
</svg>
`;

function markSvg({ title = "microcharts", ...paint }: Paint & { title?: string }) {
  return file({
    w: 128,
    h: 128,
    viewBox: "0 0 32 32",
    title,
    style: paint.adaptive
      ? style([
          `.sq { fill: ${COBALT.light}; }`,
          `@media (prefers-color-scheme: dark) { .sq { fill: ${COBALT.dark}; } }`,
        ])
      : undefined,
    body: markParts(paint).join("\n  "),
  });
}

// ── the lockup ─────────────────────────────────────────────────────────────

const round = (n: number) => Math.round(n * 100) / 100;

/** Mark box stays 32 units, so the mark's own coordinates carry over untouched. */
const BOX = 32;
const TYPE = BOX / 1.375; // the nav's ratio: a 22px mark box against 16px type
const S = TYPE / WORDMARK_EM; // wordmark units → lockup units
const GAP = round(0.625 * TYPE); // the nav's gap-2.5 at 16px
const INK_W = round((WORDMARK_INK.x1 - WORDMARK_INK.x0) * S);
const INK_H = round((WORDMARK_INK.y1 - WORDMARK_INK.y0) * S);
const ASC = round(-WORDMARK_INK.y0 * S);
/** Letters centred in the mark's box on their own ink, not on a font metric —
 *  measured against the nav, this lands within 0.1px of what flex does there. */
const BASELINE = round(BOX / 2 + ASC / 2);
/** The gap runs to the type's ORIGIN, so the 'm' keeps its left side bearing:
 *  that is what a flex gap between two boxes does, and dropping it reads a
 *  pixel tight. The trailing bearing is trimmed — a file shouldn't ship
 *  built-in whitespace on its right edge. */
const LOCK_W = round(BOX + GAP + WORDMARK_INK.x1 * S);

export const LOCKUP = { box: BOX, type: round(TYPE), gap: GAP, width: LOCK_W, height: BOX };

/** Sets the wordmark with its ORIGIN (not its ink) at x, baseline at y. */
const wordmarkAt = (x: number, baseline: number, fill: string, cls = "") =>
  `<path${cls} d="${WORDMARK_PATH}" fill="${fill}" transform="translate(${round(x)} ${baseline}) scale(${round(S * 1e4) / 1e4})"/>`;

function lockupSvg({
  title = "microcharts",
  type,
  adaptive,
  ...paint
}: Paint & { title?: string; type?: string }) {
  return file({
    w: round(LOCK_W * 4),
    h: BOX * 4,
    viewBox: `0 0 ${LOCK_W} ${BOX}`,
    title,
    style: adaptive
      ? style([
          `.sq { fill: ${COBALT.light}; }`,
          `.wm { fill: ${INK.dark}; }`,
          `@media (prefers-color-scheme: dark) {`,
          `  .sq { fill: ${COBALT.dark}; }`,
          `  .wm { fill: ${INK.light}; }`,
          `}`,
        ])
      : undefined,
    body: [
      `<g>\n    ${markParts({ ...paint, adaptive }).join("\n    ")}\n  </g>`,
      wordmarkAt(BOX + GAP, BASELINE, adaptive ? INK.dark : type!, adaptive ? ' class="wm"' : ""),
    ].join("\n  "),
  });
}

function wordmarkSvg({
  title = "microcharts",
  type,
  adaptive,
}: {
  title?: string;
  type?: string;
  adaptive?: boolean;
}) {
  return file({
    w: round(INK_W * 8),
    h: round(INK_H * 8),
    viewBox: `0 0 ${INK_W} ${INK_H}`,
    title,
    style: adaptive
      ? style([
          `.wm { fill: ${INK.dark}; }`,
          `@media (prefers-color-scheme: dark) { .wm { fill: ${INK.light}; } }`,
        ])
      : undefined,
    // Alone, the name is trimmed to its ink on all four sides.
    body: wordmarkAt(
      round(-WORDMARK_INK.x0 * S),
      ASC,
      adaptive ? INK.dark : type!,
      adaptive ? ' class="wm"' : "",
    ),
  });
}

/** Every SVG that ships, keyed by filename. */
export const BRAND_SVGS: Record<string, string> = {
  "mark.svg": markSvg({ accent: COBALT.light }),
  // The two halves the adaptive file switches between, as static files: a host
  // that already knows it is dark shouldn't have to rely on a media query.
  "mark-dark.svg": markSvg({ accent: COBALT.dark }),
  "mark-adaptive.svg": markSvg({ adaptive: true }),
  "mark-mono-dark.svg": markSvg({ mono: INK.dark }),
  "mark-mono-light.svg": markSvg({ mono: CELL_FILL }),
  "mark-ember.svg": markSvg({ accent: EMBER.light }),
  "mark-teal.svg": markSvg({ accent: TEAL.light }),
  "lockup.svg": lockupSvg({ accent: COBALT.light, type: INK.dark }),
  "lockup-dark.svg": lockupSvg({ accent: COBALT.dark, type: INK.light }),
  "lockup-adaptive.svg": lockupSvg({ adaptive: true }),
  "lockup-mono-dark.svg": lockupSvg({ mono: INK.dark, type: INK.dark }),
  "lockup-mono-light.svg": lockupSvg({ mono: CELL_FILL, type: INK.light }),
  "wordmark.svg": wordmarkSvg({ type: INK.dark }),
  "wordmark-light.svg": wordmarkSvg({ type: INK.light }),
  "wordmark-adaptive.svg": wordmarkSvg({ adaptive: true }),
};

/** The rasters, by width in px; height follows each viewBox. Sized for the
 *  jobs people actually ask for: an avatar, a slide, a README header. */
export const BRAND_PNGS: { file: string; from: string; width: number }[] = [
  { file: "mark-256.png", from: "mark.svg", width: 256 },
  { file: "mark-512.png", from: "mark.svg", width: 512 },
  { file: "mark-1024.png", from: "mark.svg", width: 1024 },
  { file: "mark-dark-512.png", from: "mark-dark.svg", width: 512 },
  { file: "mark-mono-dark-512.png", from: "mark-mono-dark.svg", width: 512 },
  { file: "mark-mono-light-512.png", from: "mark-mono-light.svg", width: 512 },
  { file: "lockup-800.png", from: "lockup.svg", width: 800 },
  { file: "lockup-1600.png", from: "lockup.svg", width: 1600 },
  { file: "lockup-dark-1600.png", from: "lockup-dark.svg", width: 1600 },
  { file: "lockup-mono-light-1600.png", from: "lockup-mono-light.svg", width: 1600 },
  { file: "wordmark-800.png", from: "wordmark.svg", width: 800 },
  { file: "wordmark-light-800.png", from: "wordmark-light.svg", width: 800 },
];

export const BRAND_README = `microcharts — brand assets
===========================

The mark: three data cells climbing a diagonal inside a superellipse
squircle, fill graded faint → solid. The grade encodes value — the same
honest channel the charts use. Never hand-redraw it; scale the SVG.

The mark
--------
mark.svg               Primary. Cobalt squircle, near-white cells.
mark-dark.svg          The dark-theme cobalt, for a known-dark host.
mark-adaptive.svg      Auto light/dark (embedded prefers-color-scheme).
mark-mono-dark.svg     One ink, dark — for light backgrounds.
mark-mono-light.svg    One ink, light — for dark backgrounds.
mark-ember.svg         Ember accent variant.
mark-teal.svg          Teal accent variant.

The lockup (mark + name)
------------------------
lockup.svg             Primary. Cobalt mark, dark ink name.
lockup-dark.svg        Dark-theme cobalt, light ink name.
lockup-adaptive.svg    Auto light/dark.
lockup-mono-dark.svg   One ink, dark — for light backgrounds.
lockup-mono-light.svg  One ink, light — for dark backgrounds.

The name on its own
-------------------
wordmark.svg           Dark ink — for light backgrounds.
wordmark-light.svg     Light ink — for dark backgrounds.
wordmark-adaptive.svg  Auto light/dark.

The name is set in Open Runde 600 at -0.016em tracking and ships as
outlines, so it renders the same on a machine that has never installed the
face. Don't reset it in another font. Open Runde is OFL; its license
travels in fonts/OpenRunde-OFL.txt.

PNG
---
png/ carries rasters of the mark (256, 512, 1024), its dark and mono
siblings (512), the lockup light and dark (800 and 1600 wide), and the
name (800 wide), all on transparent backgrounds. Use them where SVG isn't
accepted — slides, docs, chat. For anything that scales, use the SVG.

Colors
------
Cobalt (accent), light   ${COBALT.light}
Cobalt (accent), dark    ${COBALT.dark}
Cell fill (near-white)   ${CELL_FILL}
Ink (light theme)        ${INK.dark}
Paper (light theme)      ${PAPER.light}
Ink (dark theme)         ${INK.light}
Paper (dark theme)       ${PAPER.dark}

Machine-readable in colors.json, with all six accent siblings and
the semantic positive/negative pair.

Usage
-----
Use the mark to link to or reference microcharts. Keep clear space of at
least one cell-width on every side, and don't render the mark below 16px,
where the grade between the cells stops reading. Don't recolor the cells,
rotate, stretch, add effects, or imply endorsement. The name is one
lowercase word: "microcharts" — never MicroCharts, micro charts, or
µcharts. Package: @microcharts/react.

Full terms in LICENSE.txt. Code is MIT. https://microcharts.dev/brand
`;

export const BRAND_LICENSE = `microcharts brand assets — terms
=================================

The microcharts source code is MIT licensed. These brand assets are not
code, and these terms cover them instead.

You may use the mark, the lockup, and the name to refer to microcharts: a
"built with microcharts" badge, a talk slide, a blog post, a README, an
integration listing, a comparison page.

You may not:
  * modify the artwork — recolor the cells, rotate, stretch, add effects,
    or redraw it;
  * use it as your own product's or company's mark, or as part of one;
  * use it in a way that implies microcharts endorses, sponsors, or
    certifies what you're shipping.

Reuse the artwork under those terms without asking. Anything outside them:
ask first — https://x.com/ganapativs

The wordmark outlines are drawn from Open Runde, licensed under the SIL
Open Font License 1.1 (fonts/OpenRunde-OFL.txt). That license travels with
any redistribution of the wordmark or lockup files.
`;
