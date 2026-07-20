// A chart's static and interactive entries must render the SAME picture at rest
// — the interactive one only layers interaction on top. The fill/layout half of
// that promise is already gated (interactive-fill-contract.test.ts); this gate
// covers the other half: the PROP DEFAULTS the two entries fall back to.
//
// Nothing compared them before, so `<StarSpoke data={…}/>` drew an 80px labelled
// star through the static entry and a 32px unlabelled one through /interactive,
// and `<TapeGauge/>` changed viewBox between the two — both since the charts
// were first committed. A consumer switching a chart to /interactive expects
// interaction, not a resize.
//
// Static analysis over the props destructure: for every prop BOTH entries
// declare with a literal default, the defaults must match. Defaults that are
// computed rather than literal are out of reach here and stay a review concern.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const CHARTS_DIR = join(import.meta.dirname, "..", "charts");

/**
 * Props that legitimately differ, with the reason. Keep this list short: a new
 * entry is a claim that the two entries SHOULD render differently.
 */
const EXEMPT = new Set([
  // Interaction-only; the static has no motion engine and no picker.
  "animate",
  // `summary={false}` is how a client suppresses the static's duplicate
  // announcement while naming its own wrapper — divergence is the contract.
  "summary",
]);

/**
 * Per-chart exemptions: `chart.prop` → why. Each one asserts the difference is
 * invisible to the reader.
 */
const EXEMPT_CHART = new Map([
  // EN_PICTOGRAM spreads EN_SCALAR and only adds `pictogramUnit`, the roving
  // announcement the static has no keyboard for. Every template the static
  // reads is identical; the split keeps that string off the scalar glyphs.
  ["pictogram-row.strings", true],
]);

/** `const { a = 1, b = "x", ... } = props;` → Map(prop → default source text). */
function defaults(src: string): Map<string, string> {
  const start = src.indexOf("} = props;");
  if (start < 0) return new Map();
  const open = src.lastIndexOf("const {", start);
  if (open < 0) return new Map();
  const body = src.slice(open + 7, start);

  const out = new Map<string, string>();
  let depth = 0;
  let cur = "";
  for (const ch of body) {
    if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth--;
    if (ch === "," && depth === 0) {
      addEntry(out, cur);
      cur = "";
    } else cur += ch;
  }
  addEntry(out, cur);
  return out;
}

function addEntry(out: Map<string, string>, raw: string): void {
  const entry = raw.replace(/\/\/[^\n]*/g, "").trim();
  const eq = entry.indexOf("=");
  if (eq < 0) return; // no default
  const name = entry.slice(0, eq).trim();
  if (!/^[A-Za-z_$][\w$]*$/.test(name)) return; // renamed/rest/nested — skip
  out.set(
    name,
    entry
      .slice(eq + 1)
      .replace(/\s+/g, " ")
      .trim(),
  );
}

const charts = readdirSync(CHARTS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .map((name) => {
    try {
      return {
        name,
        stat: readFileSync(join(CHARTS_DIR, name, "index.tsx"), "utf8"),
        live: readFileSync(join(CHARTS_DIR, name, "client.tsx"), "utf8"),
      };
    } catch {
      return null;
    }
  })
  .filter((c): c is NonNullable<typeof c> => c !== null);

describe("static / interactive at-rest parity", () => {
  it("covers a realistic number of chart pairs", () => {
    expect(charts.length).toBeGreaterThan(90);
  });

  for (const { name, stat, live } of charts) {
    it(`${name}: shared props default the same in both entries`, () => {
      const a = defaults(stat);
      const b = defaults(live);
      const drift: string[] = [];
      for (const [prop, sv] of a) {
        if (EXEMPT.has(prop) || EXEMPT_CHART.has(`${name}.${prop}`)) continue;
        const lv = b.get(prop);
        if (lv !== undefined && lv !== sv)
          drift.push(`${prop}: static \`${sv}\` vs interactive \`${lv}\``);
      }
      expect(drift, `${name} renders differently at rest:\n  ${drift.join("\n  ")}`).toEqual([]);
    });
  }
});
