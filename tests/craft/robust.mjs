// Render robustness: every chart × every degenerate input shape.
//
// The shared edge matrix (src/test/edge-cases.ts) only fits charts whose `data`
// is a `Value[]`; 36 charts take objects, pairs or records and were never run
// against it. This derives the degenerate cases from each chart's OWN craft
// fixture by mutating whatever arrays it finds, at any depth — so a chart that
// takes `{a: number[], b: number[]}` or `{label, value}[]` gets the same
// treatment as a sparkline.
//
// The floor asserted is the documented one: never throw, never leak a
// non-finite number or `undefined` into markup, always render something.
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { CASES } from "./cases.mjs";

const D = (s) => import(`../../dist/charts/${s}/index.js`);

/** Degenerate rewrites applied to every array found in the fixture's props. */
const MUTATORS = {
  empty: () => [],
  single: (a) => a.slice(0, 1),
  "all equal": (a) => (a.length ? a.map(() => a[0]) : a),
  // Null the numeric LEAVES, not the elements: `{label, value}[]` documents a
  // nullable `value`, never a null row. Nulling rows would test a shape the
  // types forbid.
  "nulls interleaved": (a) => a.map((v, i) => (i % 2 ? nul(v) : v)),
  "all null": (a) => a.map((v) => nul(v)),
  negated: (a) => a.map((v) => num(v, (n) => -Math.abs(n))),
  huge: (a) => a.map((v) => num(v, () => 1e15)),
  tiny: (a) => a.map((v) => num(v, () => 1e-9)),
  "NaN / ±Infinity": (a) =>
    a.map((v, i) =>
      num(v, () => [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY][i % 3]),
    ),
  zeros: (a) => a.map((v) => num(v, () => 0)),
};

/** Null every numeric leaf, leaving object shape intact. */
function nul(v) {
  if (typeof v === "number") return null;
  if (v === null || v === undefined) return v;
  if (Array.isArray(v)) return v.map(nul);
  if (typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v)) o[k] = nul(v[k]);
    return o;
  }
  return v;
}

/** Apply `f` to a number, or to every number inside an object/array leaf. */
function num(v, f) {
  if (typeof v === "number") return f(v);
  if (v === null || v === undefined) return v;
  if (Array.isArray(v)) return v.map((x) => num(x, f));
  if (typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v)) o[k] = num(v[k], f);
    return o;
  }
  return v;
}

/** Rewrite every array reachable from `v` with `mut`. */
function mutate(v, mut, depth = 0) {
  if (Array.isArray(v)) return mut(v.map((x) => mutate(x, mut, depth + 1)));
  if (v && typeof v === "object" && depth < 3) {
    const o = {};
    for (const k of Object.keys(v)) o[k] = mutate(v[k], mut, depth + 1);
    return o;
  }
  return v;
}

const BAD = /(?:^|[">\s(])(NaN|-?Infinity|undefined)(?:["<\s),]|$)/;

const problems = [];
let total = 0;

for (const c of CASES) {
  let M;
  try {
    M = await D(c.slug);
  } catch (e) {
    problems.push(`${c.slug}: IMPORT FAILED ${e.message}`);
    continue;
  }
  const Comp = M[c.comp];
  if (!Comp) {
    problems.push(`${c.slug}: no export ${c.comp}`);
    continue;
  }
  const base = c.variants[0];
  for (const [name, mut] of Object.entries(MUTATORS)) {
    const props = mutate({ ...base }, mut);
    total++;
    let html;
    try {
      html = renderToStaticMarkup(createElement(Comp, props));
    } catch (e) {
      problems.push(`${c.slug} [${name}]: THREW ${e.message}`);
      continue;
    }
    if (!html || !html.length) {
      problems.push(`${c.slug} [${name}]: rendered NOTHING`);
      continue;
    }
    const m = html.match(BAD);
    if (m) {
      const at = html.indexOf(m[0]);
      problems.push(
        `${c.slug} [${name}]: leaked ${m[1]} into markup — …${html.slice(Math.max(0, at - 60), at + 40).replace(/\s+/g, " ")}…`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Hostile CONFIG.
//
// Everything above mutates DATA, because `mutate` only rewrites arrays. A bare
// numeric prop \u2014 `width`, `height`, `target`, `total`, `window`, `open` \u2014 is
// never touched by it, and that is the hole the catalog audit kept falling into
// one chart at a time: thirteen separate charts independently reported the same
// shape of bug, where a non-finite scalar produced NaN coordinates (or an
// invalid `viewBox`, which the browser DROPS) under a perfectly correct-sounding
// accessible name. A per-chart guard cannot make that a catalog invariant; this
// can.
//
// The floor is the same one the data pass asserts, plus the accessible name:
// a chart handed a nonsense scalar degrades to its documented default and says
// so, rather than announcing a value it never drew.
const HOSTILE = [
  ["NaN", Number.NaN],
  ["+Infinity", Number.POSITIVE_INFINITY],
  ["-Infinity", Number.NEGATIVE_INFINITY],
  ["zero", 0],
  ["negative", -7],
];

for (const c of CASES) {
  let M;
  try {
    M = await D(c.slug);
  } catch {
    continue; // already reported by the data pass
  }
  const Comp = M[c.comp];
  if (!Comp) continue;
  const base = c.variants[0];
  const scalars = Object.keys(base).filter((k) => typeof base[k] === "number");
  for (const key of scalars) {
    for (const [label, value] of HOSTILE) {
      total++;
      const props = { ...base, [key]: value };
      let html;
      try {
        html = renderToStaticMarkup(createElement(Comp, props));
      } catch (e) {
        problems.push(`${c.slug} [config ${key}=${label}]: THREW ${e.message}`);
        continue;
      }
      if (!html) {
        problems.push(`${c.slug} [config ${key}=${label}]: rendered NOTHING`);
        continue;
      }
      const m = html.match(BAD);
      if (m) {
        const at = html.indexOf(m[0]);
        problems.push(
          `${c.slug} [config ${key}=${label}]: leaked ${m[1]} \u2014 \u2026${html.slice(Math.max(0, at - 60), at + 40).replace(/\s+/g, " ")}\u2026`,
        );
        continue;
      }
      // An invalid viewBox is dropped by the browser, so the chart renders at
      // the wrong scale with its name still attached \u2014 silent, and worse than
      // a visible NaN.
      const vb = /viewBox="([^"]*)"/.exec(html);
      if (vb && !/^0 0 \d+(\.\d+)? \d+(\.\d+)?$/.test(vb[1])) {
        problems.push(`${c.slug} [config ${key}=${label}]: invalid viewBox "${vb[1]}"`);
      }
    }
  }
}

console.log(`${total} chart\u00d7scenario renders, ${problems.length} problems`);
for (const p of problems) console.log("  " + p);
if (problems.length) process.exit(1);
