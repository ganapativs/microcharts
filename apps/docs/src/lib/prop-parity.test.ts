import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { STABLE_CHARTS } from "./charts/registry";

// Each chart's prop table (hand-authored in lib/charts/<slug>.tsx) must document
// every chart-SPECIFIC prop the component actually accepts. Without this guard a
// component can grow a public knob that no doc page ever mentions — exactly the
// drift found in the pre-launch audit (unit, curve, variant, bins, steps, …).
//
// Shared props are documented once — in the grammar table (quickstart) and the
// PropTable footer — so per-chart tables intentionally omit them.
const SHARED = new Set([
  // layout / container / i18n — universal, covered by Sizing + the footer
  "width",
  "height",
  "id",
  "className",
  "style",
  "children",
  "locale",
  "strings",
  "ref",
  "key",
  // the shared grammar — covered by quickstart#the-shared-grammar + the footer
  "data",
  "domain",
  "color",
  "title",
  "summary",
  "label",
  "dots",
  "format",
  "positive",
  // sizing-ish universal knobs treated as layout, not chart-specific
  "size",
  "fontSize",
  "gap",
  "cell",
]);

// Escape hatch for props that are public but intentionally undocumented. Keep it
// empty; add "<slug>:<prop>" entries only with a written reason.
const INTENTIONAL = new Set<string>([]);

const chartsDir = resolve(process.cwd(), "../../src/charts");

/** Top-level member names of a chart's exported `*Props` interface. */
function componentProps(slug: string): string[] {
  const src = readFileSync(resolve(chartsDir, slug, "index.tsx"), "utf8");
  const body = src.match(/(?:export )?interface \w*Props\b[^{]*\{([\s\S]*?)\n\}/);
  if (!body) return [];
  return [...body[1]!.matchAll(/^\s*(?:readonly\s+)?([A-Za-z_]\w*)\??\s*:/gm)].map((m) => m[1]!);
}

describe("chart prop tables cover the component's public props", () => {
  for (const chart of STABLE_CHARTS) {
    it(`${chart.slug}`, () => {
      // Some rows document a pair under one name, e.g. "xLabel / yLabel" — split
      // on "/" so each covered prop counts.
      const documented = new Set(
        chart.props.flatMap((p) => p.name.split("/").map((s) => s.trim())),
      );
      const missing = componentProps(chart.slug).filter(
        (p) => !SHARED.has(p) && !documented.has(p) && !INTENTIONAL.has(`${chart.slug}:${p}`),
      );
      expect(missing, `${chart.slug} accepts undocumented props: ${missing.join(", ")}`).toEqual(
        [],
      );
    });
  }
});
