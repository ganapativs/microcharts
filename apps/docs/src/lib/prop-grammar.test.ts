/**
 * Prop-name grammar guard — same prop name must mean the same thing across the
 * catalog (CLAUDE.md non-negotiable #4). After the consistency-pass renames,
 * overloaded names are allowlisted by (slug → semantic tag). A new chart that
 * reuses a name with a different tag fails this test.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { STABLE_CHARTS } from "./charts/registry";
import { buildCatalog } from "./catalog-json";

const chartsDir = resolve(process.cwd(), "../../src/charts");

function interfaceProps(file: string): string[] {
  if (!existsSync(file)) return [];
  const src = readFileSync(file, "utf8");
  const body = src.match(/(?:export )?interface \w*Props\b[^{]*\{([\s\S]*?)\n\}/);
  if (!body) return [];
  return [...body[1]!.matchAll(/^\s*(?:readonly\s+)?([A-Za-z_]\w*)\??\s*:/gm)].map((m) => m[1]!);
}

/** Semantic tags for historically overloaded prop names. One tag per meaning. */
const SEMANTICS: Record<string, Record<string, string>> = {
  range: {
    "benchmark-strip": "bandRecipe",
  },
  bands: {
    bullet: "qualitativeThresholds",
  },
  mode: {
    // chart-local mode enums — same family (variant selector)
    "balance-beam": "chartMode",
    "burn-chart": "chartMode",
    "calibration-strip": "chartMode",
    "coverage-strip": "chartMode",
    "fill-word": "chartMode",
    funnel: "chartMode",
    horizon: "chartMode",
    hypnogram: "chartMode",
    "minimap-strip": "chartMode",
    "moon-phase": "chartMode",
    "music-staff": "staffClip",
    "net-flow": "chartMode",
    ohlc: "chartMode",
    "paired-bars": "chartMode",
    "percentile-ladder": "chartMode",
    "polar-clock": "chartMode",
    seismogram: "chartMode",
    "shift-histogram": "chartMode",
    sparkbar: "chartMode",
    "stacked-area": "chartMode",
    "tree-rings": "chartMode",
    waveform: "chartMode",
    "wind-barb": "chartMode",
  },
  open: {
    waterfall: "openingLevel",
  },
  origin: {
    "polar-clock": "clockZero",
  },
  anchor: {
    "activity-grid": "calendarAnchor",
  },
  showBands: {
    "percentile-trace": "showPopulationBands",
  },
  percentiles: {
    "folded-day-band": "percentilePairs",
  },
  threshold: {
    "quantile-dots": "classificationCutoff",
    "streak-spark": "classificationCutoff",
    "pareto-strip": "cumShareCutoff",
    "orbit-status": "latencyCutoff",
  },
  target: {
    bullet: "goalLine",
    thermometer: "goalLine",
    "dual-window-meter": "goalLine",
    "forecast-cone": "goalLine",
    "rubric-strip": "goalLine",
  },
  levels: {
    "depth-wedge": "wedgeCount",
    "graded-band": "gradeBreaks",
  },
  from: {
    delta: "priorBaseline",
  },
  trend: {
    "micro-scatter": "showTrendLine",
    "cycle-plot": "showTrendLine",
  },
};

/** Renames that must be present (new) and absent (old) on specific charts. */
const RENAMES: { slug: string; gone: string; present: string }[] = [
  { slug: "music-staff", gone: "range", present: "mode" },
  { slug: "percentile-trace", gone: "bands", present: "showBands" },
  { slug: "folded-day-band", gone: "bands", present: "percentiles" },
  { slug: "folded-day-band", gone: "levels", present: "percentiles" },
  { slug: "waterfall", gone: "start", present: "open" },
  { slug: "waterfall", gone: "from", present: "open" },
  { slug: "polar-clock", gone: "start", present: "origin" },
  { slug: "activity-grid", gone: "start", present: "anchor" },
  { slug: "orbit-status", gone: "alert", present: "threshold" },
];

describe("prop-name grammar", () => {
  it("renamed props are live on components and gone as old names", () => {
    for (const { slug, gone, present } of RENAMES) {
      const props = interfaceProps(resolve(chartsDir, slug, "index.tsx"));
      expect(props, `${slug} missing ${present}`).toContain(present);
      expect(props, `${slug} still has ${gone}`).not.toContain(gone);
    }
  });

  it("registry documents new names only", () => {
    for (const { slug, gone, present } of RENAMES) {
      const chart = STABLE_CHARTS.find((c) => c.slug === slug);
      expect(chart, slug).toBeDefined();
      const names = new Set(chart!.props.map((p) => p.name));
      expect(names.has(present), `${slug} registry missing ${present}`).toBe(true);
      expect(names.has(gone), `${slug} registry still has ${gone}`).toBe(false);
    }
  });

  it("buildCatalog emits new prop names only", () => {
    const catalog = buildCatalog();
    for (const { slug, gone, present } of RENAMES) {
      const chart = catalog.charts.find((c) => c.slug === slug);
      expect(chart, slug).toBeDefined();
      const names = new Set(chart!.props.map((p) => p.name));
      expect(names.has(present), `catalog ${slug} missing ${present}`).toBe(true);
      expect(names.has(gone), `catalog ${slug} still has ${gone}`).toBe(false);
    }
  });

  it("overloaded prop names stay on the allowlisted semantic map", () => {
    for (const chart of STABLE_CHARTS) {
      const props = interfaceProps(resolve(chartsDir, chart.slug, "index.tsx"));
      for (const prop of props) {
        const map = SEMANTICS[prop];
        if (!map) continue;
        expect(
          map[chart.slug],
          `${chart.slug} uses '${prop}' but is not in the grammar allowlist for that name`,
        ).toBeTruthy();
      }
    }
  });

  it("CyclePlot trend is boolean (unified with MicroScatter)", () => {
    const src = readFileSync(resolve(chartsDir, "cycle-plot/index.tsx"), "utf8");
    expect(src).toMatch(/trend\??:\s*boolean/);
    expect(src).not.toMatch(/trend\??:\s*"line"/);
  });
});
