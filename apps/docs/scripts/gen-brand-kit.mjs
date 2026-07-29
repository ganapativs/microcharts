/**
 * Write every brand asset and the downloadable kit.
 *
 *   pnpm gen:brand-kit            (from apps/docs)
 *
 * The sources live in src/lib/brand-assets.ts — the mark from brand.ts, the
 * name from wordmark.ts (outlined by gen-wordmark-path.py). This script is the
 * I/O half: it writes public/brand/, rasterizes the PNGs through Playwright
 * Chromium (omitBackground, so they stay transparent), and packs
 * microcharts-brand-kit.zip. Never hand-edit an asset — brand-assets.test.ts
 * fails the moment a file on disk stops matching the module.
 *
 * The zip is written here rather than shelled out to `zip`, so it can be
 * deterministic: fixed stamp, sorted entries, no extra fields. Regenerating an
 * unchanged kit produces an identical file and git sees no churn.
 */
import { deflateRawSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

import {
  BRAND_COLORS,
  BRAND_LICENSE,
  BRAND_PNGS,
  BRAND_README,
  BRAND_SVGS,
  LOCKUP,
} from "../src/lib/brand-assets.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = join(HERE, "..");
const REPO = join(DOCS, "../..");
const OUT = join(DOCS, "public/brand");
const KIT = "microcharts-brand-kit";

/** Bump when the kit's contents change. Fixed so the zip stays byte-stable. */
const STAMP = new Date("2026-07-29T00:00:00Z");

// ── rasters ────────────────────────────────────────────────────────────────

async function rasterize() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const out = {};
  for (const { file, from, width } of BRAND_PNGS) {
    const source = BRAND_SVGS[from];
    const [vw, vh] = source
      .match(/viewBox="0 0 ([\d. ]+)"/)[1]
      .trim()
      .split(/\s+/)
      .map(Number);
    const height = Math.round((width * vh) / vw);
    await page.setViewportSize({ width, height });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:${width}px;height:${height}px}</style>` +
        // Strip the fixed width/height so the viewBox drives the size.
        source.replace(/ width="[\d.]+" height="[\d.]+"/, ""),
    );
    out[file] = await page.screenshot({ omitBackground: true });
    console.log(`  ${file}  ${width}x${height}  ${(out[file].length / 1024).toFixed(1)} kB`);
  }
  await browser.close();
  return out;
}

// ── zip ────────────────────────────────────────────────────────────────────

const CRC_TABLE = Int32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

const dosTime = (d) =>
  ((d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | (d.getUTCSeconds() >> 1)) & 0xffff;
const dosDate = (d) =>
  (((d.getUTCFullYear() - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate()) & 0xffff;

/** Minimal writer for [name, Buffer] entries, in the order given: no data
 *  descriptors, no zip64 — the kit is a few hundred kB of small files. */
function zip(entries) {
  const time = dosTime(STAMP);
  const date = dosDate(STAMP);
  const locals = [];
  const central = [];
  let offset = 0;

  for (const [name, data] of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const deflated = deflateRawSync(data, { level: 9 });
    // PNGs are already deflated; storing them raw beats a second pass.
    const shrinks = deflated.length < data.length;
    const body = shrinks ? deflated : data;
    const method = shrinks ? 8 : 0;
    const crc = crc32(data);

    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    nameBuf.copy(local, 30);
    locals.push(local, body);

    const cd = Buffer.alloc(46 + nameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4); // version made by
    cd.writeUInt16LE(20, 6); // version needed
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(time, 12);
    cd.writeUInt16LE(date, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt32LE(0, 38); // external attrs
    cd.writeUInt32LE(offset, 42);
    nameBuf.copy(cd, 46);
    central.push(cd);

    offset += local.length + body.length;
  }

  const dir = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, dir, end]);
}

// ── build ──────────────────────────────────────────────────────────────────

console.log(
  `lockup ${LOCKUP.width}x${LOCKUP.height} units · type ${LOCKUP.type} · gap ${LOCKUP.gap}`,
);
mkdirSync(join(OUT, "png"), { recursive: true });

for (const [name, source] of Object.entries(BRAND_SVGS)) writeFileSync(join(OUT, name), source);
console.log(`wrote ${Object.keys(BRAND_SVGS).length} svg`);

const pngs = await rasterize();
for (const [name, buf] of Object.entries(pngs)) writeFileSync(join(OUT, "png", name), buf);

writeFileSync(join(OUT, "README.txt"), BRAND_README);

const entries = [
  [`${KIT}/README.txt`, Buffer.from(BRAND_README)],
  [`${KIT}/LICENSE.txt`, Buffer.from(BRAND_LICENSE)],
  [`${KIT}/colors.json`, Buffer.from(`${JSON.stringify(BRAND_COLORS, null, 2)}\n`)],
  [`${KIT}/fonts/OpenRunde-OFL.txt`, readFileSync(join(REPO, "assets/fonts/OpenRunde-OFL.txt"))],
  ...Object.entries(BRAND_SVGS).map(([f, s]) => [`${KIT}/svg/${f}`, Buffer.from(s)]),
  ...Object.entries(pngs).map(([f, b]) => [`${KIT}/png/${f}`, b]),
].sort(([a], [b]) => (a < b ? -1 : 1));

const archive = zip(entries);
writeFileSync(join(OUT, `${KIT}.zip`), archive);
console.log(`wrote ${KIT}.zip — ${entries.length} files, ${(archive.length / 1024).toFixed(1)} kB`);
