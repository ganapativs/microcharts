// A caller's `format` may change how a number READS. It may never silently
// change what the number MEANS.
//
// The bug this gate exists for: `makeFormatter(format, locale, defaults)`
// resolved its options as `format ?? defaults`, so the defaults were consulted
// only when the caller passed nothing at all. A chart's defaults carry its UNIT
// — `{ style: "percent" }` on the share labels of Funnel, Progress, StackedArea
// and 15 others — so `format={{ notation: "compact" }}`, written to shorten six
// figure counts, deleted `style: "percent"` from the share label in the same
// breath and rendered three percent as `0.03`. A plausible wrong number, in the
// label a reader is most likely to quote, with no warning anywhere.
//
// Two gates here, because the defect had two halves:
//   1. `makeUnitFormatter` merges per-key, and the merge is coherent.
//   2. No chart formats a MAGNITUDE and then prints a second sign in front of
//      it — the `++0.7 pp` that reached a user.
//
// The three-argument `makeFormatter` that caused this is now a type error:
// `makeFormatter` takes two parameters and the merging entry point is a
// separate export. That split is also load-bearing for size — see the note on
// `makeFormatter` in core/format.ts.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { makeFormatter, makeUnitFormatter, unsigned } from "../core/format.js";

const CHARTS_DIR = join(import.meta.dirname, "..", "charts");
const PCT = { style: "percent", maximumFractionDigits: 0 } as const;

describe("makeUnitFormatter merges the chart's unit under the caller's options", () => {
  it("keeps the unit when the caller changes something else", () => {
    // The exact reproduction from the field report: a Funnel given a compact
    // notation for its six-figure counts must still print its share as a percent.
    expect(makeUnitFormatter({ notation: "compact" }, "en-US", PCT)(0.03)).toBe("3%");
  });

  it("keeps the unit when the caller changes precision", () => {
    expect(makeUnitFormatter({ maximumFractionDigits: 2 }, "en-US", PCT)(0.0345)).toBe("3.45%");
  });

  it("lets an explicit style opt out of the unit entirely", () => {
    // The escape hatch has to keep working, or the merge just trades one silent
    // override for another.
    expect(makeUnitFormatter({ style: "decimal" }, "en-US", PCT)(0.03)).toBe("0.03");
  });

  it("drops the chart's precision along with its unit", () => {
    // `maximumFractionDigits: 0` is calibrated FOR the percent — "3%", not
    // "3.0%". Carried into `style: "decimal"` it rounds 0.03 to 0, which is the
    // same class of silent wrong number the merge exists to prevent.
    expect(makeUnitFormatter({ style: "decimal" }, "en-US", PCT)(0.03)).not.toBe("0");
  });

  it("uses the chart's defaults when the caller passes nothing", () => {
    expect(makeUnitFormatter(undefined, "en-US", PCT)(0.03)).toBe("3%");
  });

  it("passes a caller's function straight through", () => {
    expect(makeUnitFormatter(() => "custom", "en-US", PCT)(0.03)).toBe("custom");
  });

  it("does not throw when the caller's bound crosses the chart's", () => {
    // `Intl` rejects min > max with a RangeError. A chart that throws on a legal
    // prop is worse than one that rounds oddly, so the chart's bound yields.
    expect(() => makeUnitFormatter({ minimumFractionDigits: 2 }, "en-US", PCT)(0.03)).not.toThrow();
    expect(makeUnitFormatter({ minimumFractionDigits: 2 }, "en-US", PCT)(0.03)).toBe("3.00%");
  });

  it("leaves a caller's own incoherent pair as their error", () => {
    // Two contradictory numbers in ONE object is a bug the caller can see and
    // fix. Silently repairing it would hide it.
    expect(() =>
      makeUnitFormatter({ minimumFractionDigits: 4, maximumFractionDigits: 1 }, "en-US", PCT)(0.03),
    ).toThrow(RangeError);
  });

  it("still cleans float noise on both entry points", () => {
    expect(makeFormatter({ maximumFractionDigits: 2 }, "en-US")(0.1 + 0.2)).toBe("0.3");
    expect(makeUnitFormatter({ maximumFractionDigits: 2 }, "en-US", PCT)(0.1 + 0.2)).toBe("30%");
  });
});

describe("unsigned drops a sign the formatter already emitted", () => {
  it("strips the three signs the library emits", () => {
    expect(unsigned("+3%")).toBe("3%");
    expect(unsigned("-3%")).toBe("3%");
    expect(unsigned("−3%")).toBe("3%");
  });

  it("leaves an unsigned string alone", () => {
    expect(unsigned("3%")).toBe("3%");
    expect(unsigned("")).toBe("");
  });
});

/**
 * A chart that prints its own direction must format a MAGNITUDE and strip any
 * sign the formatter produced, or a caller passing `signDisplay: "always"` —
 * a legal, reasonable thing to write — reads `++3%` and `−+3%`.
 *
 * Source-level, in the idiom of readout-presence next door: rendering every
 * chart against every sign-bearing format would need a hand-written fixture per
 * chart, and the list would go stale. What can only be caught HERE is the call
 * site that formats `Math.abs(...)` and concatenates a sign onto the result
 * without passing it through `unsigned` (or `withPlus`, which guards the mirror
 * case of prepending `+` to an already-signed string).
 */
describe("no chart prints two signs", () => {
  const files: string[] = [];
  for (const chart of readdirSync(CHARTS_DIR, { withFileTypes: true })) {
    if (!chart.isDirectory()) continue;
    const dir = join(CHARTS_DIR, chart.name);
    for (const f of readdirSync(dir)) {
      if (/\.(test|browser\.test)\./.test(f)) continue;
      if (/\.tsx?$/.test(f)) files.push(join(dir, f));
    }
  }

  it("finds chart sources to scan", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  /**
   * A formatter built from a hardcoded `undefined` format cannot emit a sign —
   * there is no caller option to carry one. Every entry needs the reason, and
   * "it looked fine" is not one: if the chart ever threads its `format` prop
   * into that formatter, the guard must fire again.
   */
  const NO_CALLER_FORMAT: Record<string, string> = {
    "likert-strip/index.tsx":
      "netFmt is makeUnitFormatter(undefined, …) — the caller's format never reaches it",
  };

  it("guards every sign prepended onto a formatted absolute value", () => {
    // A literal `+` or U+2212 immediately before an interpolation that formats
    // an absolute value. `unsigned(` / `withPlus(` inside that interpolation is
    // the guard; anything else is the defect.
    const SIGN_THEN_ABS = /["'`](?:\+|-|−)["'`]?\s*\}?\$?\{?[^}\n]*?\(Math\.abs\(/g;
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const line of src.split("\n")) {
        if (!/Math\.abs\(/.test(line)) continue;
        if (!/[+−]/.test(line)) continue;
        SIGN_THEN_ABS.lastIndex = 0;
        if (!SIGN_THEN_ABS.test(line)) continue;
        if (/unsigned\(|withPlus\(/.test(line)) continue;
        // Relative to CHARTS_DIR, not `indexOf("charts")` — the repo itself is
        // called microCHARTS, so that finds the wrong slash.
        const rel = file.slice(CHARTS_DIR.length + 1);
        if (NO_CALLER_FORMAT[rel]) continue;
        offenders.push(`${rel}: ${line.trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
