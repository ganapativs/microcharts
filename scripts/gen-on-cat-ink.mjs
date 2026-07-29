#!/usr/bin/env node
/**
 * Generates the per-categorical knockout ink tokens (`--mc-on-cat-1..6`).
 *
 *   node scripts/gen-on-cat-ink.mjs --check   # exit 1 if any declared ink is under AA
 *   node scripts/gen-on-cat-ink.mjs           # print the blocks to paste
 *
 * WHY PER-CAT AND NOT ONE TOKEN. `--mc-on-cat` was a single dark ink, calibrated
 * against the library's own default cats — which are mid-tone by construction,
 * so a dark ink clears AA on eleven of the twelve. That calibration does not
 * survive a palette swap. Measured across the docs site's six accent palettes
 * and three achromatic presets, 30 of 108 categorical fills need the LIGHT ink,
 * and they are mixed in with cats that need the dark one inside the same scope —
 * `print`'s cat-1 (#14507a) wants light at 8.0:1 while the default `:root`
 * cat-1 (#d2982f) wants dark. No single per-scope token can satisfy both, which
 * is why PartitionStrip's labels measured 3.76:1 on the live site.
 *
 * The choice is a pure function of the fill, so it is computed here rather than
 * hand-tuned: pick whichever of the two inks has more contrast, and fail loudly
 * if even the better one is under 4.5:1 (that means the FILL needs changing, not
 * the ink).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

/** The two inks a knockout label may use. Alpha is composited over the fill. */
export const INK = {
  light: { rgb: [255, 255, 255], a: 0.96, css: "rgba(255, 255, 255, 0.96)" },
  dark: { rgb: [0, 0, 0], a: 0.9, css: "rgba(0, 0, 0, 0.9)" },
};

const hex = (h) => {
  const s = h.replace("#", "").trim();
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const lin = (c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const over = (fg, a, bg) => fg.map((v, i) => v * a + bg[i] * (1 - a));
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  const [hi, lo] = x > y ? [x, y] : [y, x];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};

/**
 * The grounds a chart is designed and reviewed on. A categorical fill is painted
 * at less than full opacity, so the colour a label actually sits on is the fill
 * COMPOSITED over the page — measuring the raw hex overstates the contrast.
 */
const PAGE = { light: hex("#ffffff"), dark: hex("#161616") };
/**
 * Fill opacities a LABELLED categorical segment is painted at. Only the top row
 * of a PartitionStrip carries text, and it paints at full opacity precisely so
 * its label sits on the categorical hue itself: at 0.9 over a white page the
 * fill lightens enough to cost the ink ~0.7 of contrast, which put sixteen of
 * the shipped fills under the floor for a reason that was pure compositing.
 * Depth is still encoded — deeper rows drop to 0.55, a wider gap than before.
 */
const LABELLED_OPACITIES = [1];

/**
 * Better of the two inks on `fill`, judged at the worst opacity the chart
 * actually paints, over the ground this scope belongs to. `ratio` is that
 * worst case, not the flattering one.
 */
export function pickInk(fill, ground = "light") {
  const raw = hex(fill);
  const page = PAGE[ground];
  const scored = Object.entries(INK).map(([name, ink]) => {
    let worst = Infinity;
    for (const fo of LABELLED_OPACITIES) {
      const bg = over(raw, fo, page);
      worst = Math.min(worst, contrast(over(ink.rgb, ink.a, bg), bg));
    }
    return { name, css: ink.css, ratio: Math.round(worst * 100) / 100 };
  });
  scored.sort((a, b) => b.ratio - a.ratio);
  return scored[0];
}

/** Does this selector describe a dark-ground scope? */
const groundOf = (sel) => (/dark/i.test(sel) ? "dark" : "light");

/** Every scope in a stylesheet that declares categorical fills. */
export function paletteScopes(css) {
  const out = [];
  for (const m of css.matchAll(/(^|\n)\s*([^\n{}]*?)\{([\s\S]*?)\n\s*\}/g)) {
    const sel = m[2].trim();
    const body = m[3];
    const cats = {};
    for (let i = 1; i <= 6; i++) {
      const t = new RegExp(`--mc-cat-${i}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(body);
      if (t) cats[i] = t[1];
    }
    if (Object.keys(cats).length) out.push({ sel, cats });
  }
  return out;
}

const FILES = ["styles.css", "apps/docs/src/app/global.css"];

/**
 * Rewrites each palette scope so its `--mc-cat-6` is followed by the six
 * `--mc-on-cat-N` tokens. Idempotent: existing ones are stripped first.
 *
 * Scopes that derive their cats with `color-mix` instead of hex (mono, eink)
 * are skipped — they set the single `--mc-on-cat`, and the chart rules fall
 * back to it, so those palettes keep working untouched.
 */
export function injectInks(css) {
  const stripped = css.replace(/^[ \t]*--mc-on-cat-[1-6]:[^\n]*\n/gm, "");
  return stripped.replace(
    /^([ \t]*)--mc-cat-6:\s*(#[0-9a-fA-F]{6})\s*;([^\n]*)$/gm,
    (line, indent, cat6, trailing, offset, whole) => {
      // Read cats 1–5 from the same scope: walk back to the nearest `{`.
      const open = whole.lastIndexOf("{", offset);
      const scope = whole.slice(open, offset + line.length);
      const cats = {};
      for (let i = 1; i <= 6; i++) {
        const m = new RegExp(`--mc-cat-${i}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(scope);
        if (m) cats[i] = m[1];
      }
      cats[6] = cat6;
      if (Object.keys(cats).length < 6) return line;
      const ground = groundOf(whole.slice(Math.max(0, open - 200), open));
      const decls = Object.entries(cats)
        .map(([i, fill]) => {
          const best = pickInk(fill, ground);
          return `${indent}--mc-on-cat-${i}: ${best.css}; /* ${fill} ${best.ratio}:1 */`;
        })
        .join("\n");
      return `${line}\n${decls}`;
    },
  );
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^.*[/\\]/, ""))) {
  const check = process.argv.includes("--check");
  let failures = 0;
  let stale = 0;

  for (const file of FILES) {
    const path = resolve(root, file);
    const css = readFileSync(path, "utf8");

    // Every categorical fill must be labellable by ONE of the two inks. If not,
    // the FILL is wrong, not the ink — no amount of token plumbing fixes a
    // mid-lightness hue, so this fails loudly rather than picking the best of
    // two bad options.
    for (const { sel, cats } of paletteScopes(css)) {
      for (const [i, fill] of Object.entries(cats)) {
        const best = pickInk(fill, groundOf(sel));
        if (best.ratio < 4.5) {
          failures++;
          console.error(`UNDER AA  ${file}  ${sel}  --mc-cat-${i}: ${fill} → ${best.ratio}:1`);
        }
      }
    }

    const next = injectInks(css);
    if (next === css) continue;
    if (check) {
      stale++;
      console.error(`${file} is stale — run \`node scripts/gen-on-cat-ink.mjs\` and commit.`);
    } else {
      writeFileSync(path, next);
      console.error(`${file} updated.`);
    }
  }

  if (failures) {
    console.error(`\n${failures} categorical fill(s) cannot be labelled at AA by either ink.`);
    process.exit(1);
  }
  if (stale) process.exit(1);
  console.error("every categorical fill can be labelled at AA, and its ink token is in sync.");
}
