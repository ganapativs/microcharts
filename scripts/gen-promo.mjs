/**
 * Regenerate the README promo + GitHub social images from their SVG sources.
 *
 *   pnpm gen:promo
 *
 * `assets/templates/{promo,social}.svg` are the hand-authored layout TEMPLATES
 * (ground, lockup, cards, copy) — but every chart in them is the REAL shipped
 * component. `<!--@chart name x= y= w= h=-->` slots are filled at generation
 * time by server-rendering the built `dist/` entries (react-dom/server) and
 * nesting the resulting `<svg class="mc-root">` markup at the slot position.
 * The composed result is written to `assets/{promo,social}.svg` as a
 * STANDALONE artifact — `dist/styles.css`, the dark theme + cobalt accent, and
 * the brand fonts are all embedded, so the file renders complete anywhere
 * (edit the template, never the composed output). Delta renders inline HTML,
 * so its slot becomes a `<foreignObject>`. Build the library before running
 * this (`pnpm build`) — the charts come from `dist/`, not `src/`.
 *
 * Rasterizes with Playwright Chromium, not sharp/librsvg: librsvg ignores
 * `@font-face` (brand webfonts would silently fall back) and can't style the
 * injected charts from a stylesheet. Chromium honors the fonts registered
 * below from `assets/fonts/` (committed copies of the site's latin subsets —
 * deterministic, offline). sharp (already in the pnpm store transitively)
 * then recompresses Chromium's PNG. Each PNG is mirrored to
 * `apps/docs/public/` so `microcharts.dev/<name>.png` stays in sync.
 *
 * Kept out of the npm tarball (the README's relative path rewrites to the repo
 * raw URL on npm). Run this only when a template or featured chart changes.
 */
import {
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const ROOT = process.cwd();
// scale keeps the historical raster sizes: promo 1200×420 → ~3200px wide
// (old sharp density 192 ≈ 2.67×), social 1280×640 → 2560×1280 (2×).
const IMAGES = [
  { name: "promo", scale: 8 / 3 },
  { name: "social", scale: 2 },
];

// The site's faces, latin subsets, committed beside the SVG sources.
const FONTS = [
  { family: "Open Runde", file: "OpenRunde-500-latin.woff2", weight: "500" },
  { family: "Open Runde", file: "OpenRunde-600-latin.woff2", weight: "600" },
  { family: "Open Runde", file: "OpenRunde-700-latin.woff2", weight: "700" },
  { family: "Hanken Grotesk", file: "HankenGrotesk-latin.woff2", weight: "100 900" },
  { family: "Iosevka", file: "Iosevka-400-latin.woff2", weight: "400" },
  { family: "Iosevka", file: "Iosevka-500-latin.woff2", weight: "500" },
  { family: "Iosevka", file: "Iosevka-700-latin.woff2", weight: "700" },
];

// ── the featured charts — real components, realistic series ────────────────
const { Sparkline } = await import(
  pathToFileURL(join(ROOT, "dist/charts/sparkline/index.js")).href
);
const { SparkBar } = await import(pathToFileURL(join(ROOT, "dist/charts/sparkbar/index.js")).href);
const { ActivityGrid } = await import(
  pathToFileURL(join(ROOT, "dist/charts/activity-grid/index.js")).href
);
const { Delta } = await import(pathToFileURL(join(ROOT, "dist/charts/delta/index.js")).href);
const { ProgressRing } = await import(
  pathToFileURL(join(ROOT, "dist/charts/progress-ring/index.js")).href
);
const { Waveform } = await import(pathToFileURL(join(ROOT, "dist/charts/waveform/index.js")).href);
const { Ohlc } = await import(pathToFileURL(join(ROOT, "dist/charts/ohlc/index.js")).href);
const { MicroDonut } = await import(
  pathToFileURL(join(ROOT, "dist/charts/micro-donut/index.js")).href
);
const { SegmentedBar } = await import(
  pathToFileURL(join(ROOT, "dist/charts/segmented-bar/index.js")).href
);
const { HeatStrip } = await import(
  pathToFileURL(join(ROOT, "dist/charts/heat-strip/index.js")).href
);

// The brand series (the homepage hero sparkline) + honest small datasets.
const HERO = [3, 5, 4, 8, 6, 9, 7, 11];
const FLOW = [4, -2, 5, 3, -1.5, 6, -2.5, 4.8];
// Contribution-style activity, column-major weeks (0 = quiet day). A seeded
// LCG keeps the texture organic but deterministic across regenerations.
const WEEKS_ALL = (() => {
  let s = 42;
  const rnd = () => (s = (s * 48271) % 2147483647) / 2147483647;
  return Array.from({ length: 24 * 7 }, () => {
    const r = rnd();
    return r < 0.22 ? 0 : Math.round(r * 10);
  });
})();
const WEEKS = WEEKS_ALL.slice(0, 112);
// The same proven series the promo film's catalog uses (video/src/charts.tsx).
const ACCENT = "#528dff";
const WAVE = Array.from({ length: 90 }, (_, i) => Math.sin(i / 3) * 0.15 + Math.sin(i / 11) * 0.35);
const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
];
// Slightly flatter mix for the labeled bar — every percent label fits its segment.
const SEG_MIX = [
  { label: "Chrome", value: 520 },
  { label: "Safari", value: 245 },
  { label: "Firefox", value: 135 },
];
const HOURLY = [12, 25, 38, 52, 66, 79, 88, 90, 84, 71, 55, 40, 28, 45, 62, 78, 85, 74, 58, 35];
const OHLC = Array.from({ length: 14 }, (_, i) => {
  const base = 140 + Math.sin(i / 3) * 8 + i * 0.9;
  return {
    open: Math.round(base * 10) / 10,
    high: Math.round((base + 4 + Math.sin(i)) * 10) / 10,
    low: Math.round((base - 4 - Math.cos(i)) * 10) / 10,
    close: Math.round((base + Math.sin(i * 2) * 3) * 10) / 10,
  };
});

/** Render a slot's chart to markup. `w`/`h` are the slot box in viewBox units. */
function chartMarkup(name, w, h, fs) {
  const el = React.createElement;
  switch (name) {
    case "sparkline":
      // accent-colored line — the homepage hero treatment, not the plain ink default
      return renderToStaticMarkup(
        el(Sparkline, { data: HERO, width: w, height: h, dots: "auto", color: ACCENT }),
      );
    case "sparkbar":
      // a touch more air between bars than the default — reads neater at card scale
      return renderToStaticMarkup(el(SparkBar, { data: FLOW, width: w, height: h, gap: 0.35 }));
    case "activity":
      // sizes itself from the cell grid; the nested-svg meet fit centers it
      return renderToStaticMarkup(el(ActivityGrid, { data: WEEKS }));
    case "activity24":
      return renderToStaticMarkup(el(ActivityGrid, { data: WEEKS_ALL }));
    case "ring":
      return renderToStaticMarkup(el(ProgressRing, { value: 0.72, label: "percent" }));
    case "waveform":
      // `progress` tints the played fraction accent — the colored treatment
      return renderToStaticMarkup(
        el(Waveform, { data: WAVE, width: w, height: h, progress: 0.62 }),
      );
    case "ohlc":
      return renderToStaticMarkup(el(Ohlc, { data: OHLC, width: w, height: h }));
    case "donut":
      return renderToStaticMarkup(el(MicroDonut, { data: MIX }));
    case "segmented":
      return renderToStaticMarkup(el(SegmentedBar, { data: SEG_MIX, width: w, height: h }));
    case "heatstrip":
      return renderToStaticMarkup(el(HeatStrip, { data: HOURLY, width: w, height: h }));
    case "delta": {
      // Delta is inline HTML (owns its own baseline) → foreignObject host.
      const html = renderToStaticMarkup(el(Delta, { value: 1394, from: 1240 }));
      return `<div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:center;justify-content:center;height:100%;font-size:${fs}px;line-height:1">${html}</div>`;
    }
    default:
      throw new Error(`unknown chart slot "${name}"`);
  }
}

/** Fill every `<!--@chart …-->` slot in a template with real chart markup. */
function fillSlots(svg) {
  return svg.replace(
    /<!--@chart (\w+) x=([\d.]+) y=([\d.]+) w=([\d.]+) h=([\d.]+)(?: fs=([\d.]+))?-->/g,
    (_, name, x, y, w, h, fs) => {
      const markup = chartMarkup(name, Number(w), Number(h), Number(fs || 0));
      if (name === "delta") {
        return `<foreignObject x="${x}" y="${y}" width="${w}" height="${h}">${markup}</foreignObject>`;
      }
      // Nest the chart's own <svg> at the slot: pin the box, keep the chart's
      // viewBox so `meet` letterboxes/centers marks whose aspect differs.
      return markup.replace(
        /^<svg class="([^"]*)" viewBox="([^"]*)"[^>]*?(style="[^"]*")/,
        (tag, cls, vb, style) =>
          `<svg class="${cls}" viewBox="${vb}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" ${style}`,
      );
    },
  );
}

/** Find sharp in the pnpm store (avoids a declared dep + keeps knip quiet). */
async function loadSharp() {
  const store = join(ROOT, "node_modules/.pnpm");
  if (existsSync(store)) {
    for (const dir of readdirSync(store)) {
      if (!dir.startsWith("sharp@")) continue;
      const entry = join(store, dir, "node_modules/sharp/lib/index.js");
      if (existsSync(entry)) {
        try {
          return (await import(pathToFileURL(entry).href)).default;
        } catch {
          // try the next matching version
        }
      }
    }
  }
  throw new Error(
    "sharp not found in the pnpm store. Run `pnpm add -Dw sharp` to enable promo rasterization.",
  );
}

const sharp = await loadSharp();
const { chromium } = await import("playwright");

// Fonts are embedded as base64 data: URIs — a setContent() page has no origin,
// so Chromium rejects file:// font requests with a NetworkError and silently
// falls back to the system face. data: URIs always load.
const fontFaces = FONTS.map(({ family, file, weight }) => {
  const path = join(ROOT, "assets/fonts", file);
  if (!existsSync(path)) throw new Error(`missing ${path}`);
  const b64 = readFileSync(path).toString("base64");
  return `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:${weight};font-style:normal}`;
}).join("\n");
const chartCss = readFileSync(join(ROOT, "dist/styles.css"), "utf8");

const browser = await chromium.launch();
try {
  for (const { name, scale } of IMAGES) {
    const tplPath = join(ROOT, `assets/templates/${name}.svg`);
    if (!existsSync(tplPath)) throw new Error(`missing ${tplPath}`);
    let svg = fillSlots(readFileSync(tplPath, "utf8"));
    const [rootTag, w, h] = svg.match(/^<svg width="(\d+)" height="(\d+)"[^>]*>/) ?? [];
    if (!w || !h) throw new Error(`${name} template must declare integer width/height on the root`);

    // Make the composed SVG standalone: dark chart tokens on the root + the
    // shipped stylesheet and the brand fonts embedded inside the document.
    // `assets/<name>.svg` is this composed artifact — open it anywhere and the
    // real charts render; the hand-authored source stays in assets/templates/.
    const themedRoot = rootTag.replace(
      /^<svg /,
      `<svg data-mc-theme="dark" style="--mc-accent:#528dff;--mc-font:'Open Runde','Hanken Grotesk',ui-sans-serif,system-ui,sans-serif" `,
    );
    // CDATA: the stylesheet contains `syntax: "<number>"` (@property), and a
    // raw `<` inside <style> breaks the strict XML parse of a standalone .svg.
    svg = svg.replace(rootTag, `${themedRoot}<style><![CDATA[${fontFaces}\n${chartCss}]]></style>`);
    const svgOut = join(ROOT, `assets/${name}.svg`);
    writeFileSync(svgOut, svg);

    const page = await browser.newPage({
      viewport: { width: Number(w), height: Number(h) },
      deviceScaleFactor: scale,
    });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg}`,
    );
    // Force-load every face and fail loudly — a fallback face must never make
    // it into a shipped banner silently.
    const failed = await page.evaluate(async (faces) => {
      for (const f of faces)
        await document.fonts.load(`${f.weight.split(" ")[0]} 16px '${f.family}'`).catch(() => {});
      await document.fonts.ready;
      return [...document.fonts]
        .filter((f) => f.status !== "loaded")
        .map((f) => `${f.family} ${f.weight}: ${f.status}`);
    }, FONTS);
    if (failed.length) throw new Error(`fonts failed to load: ${failed.join(", ")}`);
    const raw = await page.screenshot({ omitBackground: true });
    await page.close();

    const png = join(ROOT, `assets/${name}.png`);
    const pub = join(ROOT, `apps/docs/public/${name}.png`);
    await sharp(raw).png({ compressionLevel: 9 }).toFile(png);
    copyFileSync(png, pub);
    const kb = (statSync(png).size / 1024).toFixed(1);
    console.log(`${name}.svg + ${name}.png regenerated (${kb} kB) → assets/ + apps/docs/public/`);
  }
} finally {
  await browser.close();
}
