// The playground's shuffle must hand a chart a NEW reading of the SAME chart.
//
// It is a single shape-agnostic walk (`jitter`) applied to every measurement
// prop of all 106 charts, so one wrong rule is 106 broken playgrounds — and the
// breakage is invisible to every other test, because each individual datum stays
// perfectly valid. OHLC is the case that exposed it: 20 sessions drawn around
// 140–156 shuffled to a run spanning 89–207, every bar still satisfying
// `low ≤ open,close ≤ high`, and every BODY squashed from 9% of the plot to 1.5%
// once the chart fitted its domain to the scatter. The playground drew twenty
// dots and called it a candlestick chart.
//
// What makes a shuffle "the same chart" is not the values but the RATIOS between
// them: a candle body is only readable as a fraction of the series' own range.
// So this file sweeps the whole catalog and asserts, per measurement prop:
//
//   1. The series ENVELOPE survives. A shuffle may not widen the range it is
//      drawn in, because everything inside is measured against it.
//   2. Object field ORDER survives, as a weak ordering. `low` may not overtake
//      `high`; `from` may not cross `to`.
//   3. Something actually MOVED. A shuffle that returns its input is the other
//      failure, and it is just as silent.
import { describe, expect, it } from "vitest";
import { CHART_MODULE_LAZY } from "./modules.generated";
import { measurementProps, shuffleChartProps } from "./inject-chart-props";
import { jitter, shuffleBase } from "./jitter";
import type { KnobValue } from "./types";
import { PLAIN_SERIES } from "@/components/charts/playground-options";

const SEEDS = [1, 2, 3, 7, 42];

/** Every finite number under a value, in document order. */
function numbers(value: unknown, out: number[] = []): number[] {
  if (typeof value === "number") {
    if (Number.isFinite(value)) out.push(value);
  } else if (Array.isArray(value)) {
    for (const v of value) numbers(v, out);
  } else if (value !== null && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) numbers(v, out);
  }
  return out;
}

function span(ns: number[]): { lo: number; hi: number; width: number } {
  let lo = Infinity;
  let hi = -Infinity;
  for (const n of ns) {
    if (n < lo) lo = n;
    if (n > hi) hi = n;
  }
  return { lo, hi, width: hi - lo };
}

/** Ordered field-pair signs for every plain object in a tree, keyed by path. */
function orderings(value: unknown, path = "", out: Map<string, number[]> = new Map()) {
  if (Array.isArray(value)) {
    for (const v of value) orderings(v, path, out);
  } else if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => typeof v === "number" && Number.isFinite(v),
    ) as [string, number][];
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const key = `${path}.${entries[i]![0]}<>${entries[j]![0]}`;
        const sign = Math.sign(entries[i]![1] - entries[j]![1]);
        (out.get(key) ?? out.set(key, []).get(key)!).push(sign);
      }
    }
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === "object") orderings(v, `${path}.${k}`, out);
    }
  }
  return out;
}

const slugs = Object.keys(CHART_MODULE_LAZY).sort();

describe("playground shuffle keeps the chart recognisable", () => {
  it("covers the whole catalog", () => {
    expect(slugs.length).toBeGreaterThanOrEqual(106);
  });

  for (const slug of slugs) {
    it(`${slug}: shuffled data stays in its own envelope`, async () => {
      const mod = (await CHART_MODULE_LAZY[slug]!()).default;
      const spec = mod.playground;
      if (!spec) return;
      const state: Record<string, KnobValue> = Object.fromEntries(
        spec.knobs.map((k) => [k.key, k.init]),
      );
      const preview = spec.render(state, spec.data ?? mod.entry.demo);
      const props = measurementProps(preview);
      if (props.length === 0) return;

      for (const seed of SEEDS) {
        const shuffled = shuffleChartProps(preview, seed);
        // Compare each measurement prop against its own original.
        const before = measurementValues(preview, props);
        const after = measurementValues(shuffled, props);

        for (const key of props) {
          const a = numbers(before[key]);
          const b = numbers(after[key]);
          if (a.length === 0) continue;
          expect(b.length, `${slug}.${key} lost values`).toBe(a.length);

          const sa = span(a);
          const sb = span(b);
          // A scalar prop (`value={312}` on a Bullet, a Delta, a dice roll) is
          // not a series and has no ratio to hold — moving it freely IS the
          // shuffle. Nor is an OBJECT prop: its fields take one shared factor,
          // so the whole thing rescales uniformly and the picture is unchanged.
          // The envelope rule bites where elements are drawn against each
          // other, which is an ARRAY.
          if (!Array.isArray(before[key]) || a.length < 2 || sa.width === 0) continue;
          // Values are stored rounded to 4dp, so the floor itself is only known
          // to that precision.
          const eps = 1e-4 + Math.abs(sa.width) * 1e-9;
          // The envelope may shrink (a calmer reading is still this chart) but
          // never widen — widening is what flattens every proportion inside it.
          expect(
            sb.lo,
            `${slug}.${key} seed ${seed}: shuffle dropped below the series floor`,
          ).toBeGreaterThanOrEqual(sa.lo - eps);
          expect(
            sb.hi,
            `${slug}.${key} seed ${seed}: shuffle rose above the series ceiling`,
          ).toBeLessThanOrEqual(sa.hi + eps);

          // Weak ordering inside each object survives, so a bar cannot invert.
          const oa = orderings(before[key]);
          const ob = orderings(after[key]);
          for (const [pair, signs] of oa) {
            const now = ob.get(pair);
            if (!now) continue;
            for (let i = 0; i < signs.length; i++) {
              const was = signs[i]!;
              const is = now[i]!;
              if (was !== 0 && is !== 0) {
                expect(is, `${slug}.${key} seed ${seed}: ${pair} inverted`).toBe(was);
              }
            }
          }
        }
      }
    });
  }

  it("a shuffle actually changes the reading", async () => {
    const unchanged: string[] = [];
    for (const slug of slugs) {
      const mod = (await CHART_MODULE_LAZY[slug]!()).default;
      const spec = mod.playground;
      if (!spec) continue;
      const state: Record<string, KnobValue> = Object.fromEntries(
        spec.knobs.map((k) => [k.key, k.init]),
      );
      const preview = spec.render(state, spec.data ?? mod.entry.demo);
      const props = measurementProps(preview);
      if (props.length === 0) continue;
      const before = measurementValues(preview, props);
      const after = measurementValues(shuffleChartProps(preview, 5), props);
      const moved = props.some((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
      if (!moved) unchanged.push(slug);
    }
    expect(unchanged, `these charts shuffle to themselves:\n${unchanged.join("\n")}`).toEqual([]);
  });
});

// The playground does not always shuffle through `jitter`. When a chart's
// `dataShape` is a plain numeric series it takes the `injectsData` branch
// instead, which pushes `shuffleSeries(entry.demo)` in as the chart's `data`.
// That is only correct while `entry.demo` IS the series the playground renders.
// It frequently is not: `demo` doubles as the inline sparkline sample, so
// `dual-window-meter` renders 60 loudness samples and carries `demo: [-22]` —
// one point. Pressing shuffle replaced a 60-sample meter with a single reading.
//
// The two branches together are the whole shuffle surface, so a guard that only
// covers `jitter` (as this file first did) certifies half of it and misses the
// louder half.
describe("the injected-series branch shuffles the series on screen", () => {
  it("never swaps a rendered series for a shorter demo sample", async () => {
    const wrong: string[] = [];
    for (const slug of slugs) {
      const mod = (await CHART_MODULE_LAZY[slug]!()).default;
      const spec = mod.playground;
      if (!spec || spec.data) continue;
      if (!PLAIN_SERIES.test(mod.entry.dataShape) || mod.entry.demo.length === 0) continue;

      const state: Record<string, KnobValue> = Object.fromEntries(
        spec.knobs.map((k) => [k.key, k.init]),
      );
      const chart = findChart(spec.render(state, mod.entry.demo));
      const rendered = chart?.props?.["data"];
      if (!Array.isArray(rendered)) continue;
      const base = shuffleBase(mod.entry.demo, rendered);
      if (base.length !== rendered.length) {
        wrong.push(`${slug}: renders ${rendered.length} points, shuffle base has ${base.length}`);
      }
    }
    expect(wrong, `shuffle would resize these charts:\n${wrong.join("\n")}`).toEqual([]);
  });
});

/** Measurement prop values off a preview tree, by key. */
function measurementValues(node: unknown, keys: string[]): Record<string, unknown> {
  const chart = findChart(node);
  const out: Record<string, unknown> = {};
  if (!chart) return out;
  for (const k of keys) out[k] = (chart.props as Record<string, unknown>)[k];
  return out;
}

/** Same descent `inject-chart-props` uses: host nodes wrap the chart element. */
function findChart(node: unknown): { props: Record<string, unknown> } | null {
  const el = node as { type?: unknown; props?: { children?: unknown } } | null;
  if (!el || typeof el !== "object" || !("type" in el)) return null;
  if (typeof el.type !== "string") return el as { props: Record<string, unknown> };
  const kids = el.props?.children;
  for (const child of Array.isArray(kids) ? kids : [kids]) {
    const hit = findChart(child);
    if (hit) return hit;
  }
  return null;
}

describe("jitter's own contract", () => {
  it("seed 0 is the identity", () => {
    const v = [{ open: 1, high: 3, low: 0.5, close: 2 }];
    expect(jitter(v, 0)).toBe(v);
  });

  it("holds a candlestick run inside its original range", () => {
    const sessions = Array.from({ length: 20 }, (_, i) => {
      const base = 140 + Math.sin(i / 3) * 8 + i * 0.6;
      return { open: base, high: base + 3, low: base - 3, close: base + 2 };
    });
    const before = span(numbers(sessions));
    for (const seed of SEEDS) {
      const after = span(numbers(jitter(sessions, seed)));
      // The regression: this ratio reached 6x, which is what turned every
      // candle body into a dot.
      expect(after.width / before.width).toBeLessThanOrEqual(1.0001);
    }
  });
});
