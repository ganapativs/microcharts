/**
 * Regenerate the README promo + GitHub social images from their SVG sources.
 *
 *   pnpm gen:promo
 *
 * `assets/promo.svg` and `assets/social.svg` are the source of truth
 * (hand-authored, real chart forms in the brand palette, set in the site's
 * faces — Open Runde / Hanken Grotesk / JetBrains Mono). GitHub/npm strip
 * inline SVG, so the shipped hero is a PNG; each PNG is also mirrored to
 * `apps/docs/public/` so `microcharts.dev/<name>.png` stays in sync.
 *
 * Rasterizes with Playwright Chromium, not sharp/librsvg: librsvg ignores
 * `@font-face`, so brand webfonts would silently fall back to system faces.
 * Chromium honors the fonts registered below from `assets/fonts/` (committed
 * copies of the site's latin subsets — deterministic, offline). sharp (already
 * in the pnpm store transitively) then recompresses Chromium's PNG.
 *
 * Kept out of the npm tarball (the README's relative path rewrites to the repo
 * raw URL on npm). Run this only when an SVG changes — the banners are
 * otherwise evergreen (no version number to churn).
 */
import { copyFileSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

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
  { family: "JetBrains Mono", file: "JetBrainsMono-latin.woff2", weight: "100 800" },
];

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

const fontFaces = FONTS.map(({ family, file, weight }) => {
  const path = join(ROOT, "assets/fonts", file);
  if (!existsSync(path)) throw new Error(`missing ${path}`);
  return `@font-face{font-family:'${family}';src:url('${pathToFileURL(path).href}') format('woff2');font-weight:${weight};font-style:normal}`;
}).join("\n");

const browser = await chromium.launch();
try {
  for (const { name, scale } of IMAGES) {
    const svgPath = join(ROOT, `assets/${name}.svg`);
    if (!existsSync(svgPath)) throw new Error(`missing ${svgPath}`);
    const svg = readFileSync(svgPath, "utf8");
    const [, w, h] = svg.match(/^<svg width="(\d+)" height="(\d+)"/) ?? [];
    if (!w || !h) throw new Error(`${name}.svg must declare integer width/height on the root`);

    const page = await browser.newPage({
      viewport: { width: Number(w), height: Number(h) },
      deviceScaleFactor: scale,
    });
    await page.setContent(
      `<style>${fontFaces}\nhtml,body{margin:0;background:transparent}svg{display:block}</style>${svg}`,
    );
    await page.evaluate(() => document.fonts.ready);
    const raw = await page.screenshot({ omitBackground: true });
    await page.close();

    const png = join(ROOT, `assets/${name}.png`);
    const pub = join(ROOT, `apps/docs/public/${name}.png`);
    await sharp(raw).png({ compressionLevel: 9 }).toFile(png);
    copyFileSync(png, pub);
    const kb = (statSync(png).size / 1024).toFixed(1);
    console.log(`${name}.png regenerated (${kb} kB) → assets/ + apps/docs/public/`);
  }
} finally {
  await browser.close();
}
