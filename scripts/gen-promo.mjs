/**
 * Regenerate the README promo image from its SVG source.
 *
 *   pnpm gen:promo
 *
 * `assets/promo.svg` is the source of truth (hand-authored, real chart forms in
 * the brand palette). This rasterizes it to a retina PNG for the README hero
 * (GitHub/npm strip inline SVG, so the shipped hero is a PNG) and mirrors it to
 * `apps/docs/public/` so `microcharts.dev/promo.png` stays in sync.
 *
 * Kept out of the npm tarball (the README's relative path rewrites to the repo
 * raw URL on npm). Run this only when the SVG changes — the banner is otherwise
 * evergreen (no version number to churn).
 *
 * Uses `sharp` resolved from the pnpm store rather than a declared dependency:
 * it is already installed transitively, and the library's zero-dependency
 * promise means we don't want a native image lib in our own manifest just to
 * redraw a banner now and then.
 */
import { copyFileSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
// sharp reads SVG at 72dpi, so `density` sets the raster scale. Each image is
// mirrored to apps/docs/public/ so microcharts.dev/<name>.png stays in sync.
const IMAGES = [
  // README hero — 1200×420 wide banner, density 192 ≈ 2.7× → ~3200px.
  { name: "promo", density: 192 },
  // GitHub social preview — 1280×640 (2:1), density 144 = 2× → 2560×1280.
  { name: "social", density: 144 },
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

for (const { name, density } of IMAGES) {
  const svg = join(ROOT, `assets/${name}.svg`);
  const png = join(ROOT, `assets/${name}.png`);
  const pub = join(ROOT, `apps/docs/public/${name}.png`);
  if (!existsSync(svg)) throw new Error(`missing ${svg}`);
  await sharp(readFileSync(svg), { density }).png({ compressionLevel: 9 }).toFile(png);
  copyFileSync(png, pub);
  const kb = (statSync(png).size / 1024).toFixed(1);
  console.log(`${name}.png regenerated (${kb} kB) → assets/ + apps/docs/public/`);
}
