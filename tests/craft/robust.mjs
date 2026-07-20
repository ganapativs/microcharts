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

console.log(`${total} chart\u00d7scenario renders, ${problems.length} problems`);
for (const p of problems) console.log("  " + p);
if (problems.length) process.exit(1);
