// Shared edge-case matrix. Every chart's index.test
// runs the SAME degenerate inputs, so "handles empty/null/NaN" is a suite-wide
// invariant, not a per-chart courtesy — this kills the Grafana bug class.
// Behavior asserted here is the documented floor: never crash, never leak a
// non-finite number into markup, always keep the accessible-name contract.
import { StrictMode, createElement, type ReactElement } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Value } from "../core/types.js";

/** The matrix. Deterministic — property tests live next to each geometry. */
export const EDGE_SERIES: Record<string, readonly Value[]> = {
  empty: [],
  "single point": [5],
  "all equal": [4, 4, 4, 4, 4],
  "nulls interleaved": [3, null, 5, null, 8, 2],
  "all null": [null, null, null],
  "negative only": [-5, -2, -9, -1, -4],
  "huge magnitudes": [1e15, 3e15, 2e15, 9e14],
  "tiny magnitudes": [1e-9, 3e-9, 2e-9, 4e-9],
  "NaN and ±Infinity": [3, Number.NaN, 5, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 7],
  "10k points": Array.from({ length: 10_000 }, (_, i) => (i * 37) % 101),
};

/** Scalar spellings of the same matrix for value-shaped charts (Delta, Bullet). */
export const EDGE_VALUES: Record<string, number> = {
  zero: 0,
  "negative zero": -0,
  negative: -42,
  "huge magnitude": 1e15,
  "tiny magnitude": 1e-9,
  NaN: Number.NaN,
  Infinity: Number.POSITIVE_INFINITY,
  "-Infinity": Number.NEGATIVE_INFINITY,
};

// aria-label included: a summary that reads "NaN of 80 target" is a leak too.
const NUMERIC_ATTRS = [
  "d",
  "x",
  "y",
  "x1",
  "x2",
  "y1",
  "y2",
  "cx",
  "cy",
  "r",
  "width",
  "height",
  "points",
  "viewBox",
  "aria-label",
];

/** No non-finite number may ever reach markup — not in geometry, not in text. */
function expectNoNonFiniteLeak(root: HTMLElement): void {
  for (const el of root.querySelectorAll("*")) {
    for (const attr of NUMERIC_ATTRS) {
      const v = el.getAttribute(attr);
      if (v !== null) expect(v, `<${el.tagName} ${attr}>`).not.toMatch(/NaN|Infinity/);
    }
  }
  expect(root.textContent).not.toMatch(/NaN|Infinity|undefined/);
}

/** The accessible-name contract holds even for degenerate data. */
function expectA11yShape(root: HTMLElement): void {
  const named = root.querySelector('[role="img"][aria-label], [role="img"][aria-labelledby]');
  const decorative = root.querySelector('[aria-hidden="true"]');
  expect(named ?? decorative, "role=img with a name, or explicitly decorative").not.toBeNull();
}

function runCase(ui: ReactElement): HTMLElement {
  const { container } = render(createElement(StrictMode, null, ui));
  return container;
}

/**
 * Apply the series matrix to a chart. `renderChart` should pass the series as
 * the chart's `data` and give it a `title` so the naming contract is exercised.
 */
export function seriesEdgeSuite(
  name: string,
  renderChart: (data: readonly Value[]) => ReactElement,
): void {
  describe(`<${name}> shared edge matrix (src/test/edge-cases.ts)`, () => {
    for (const [label, series] of Object.entries(EDGE_SERIES)) {
      it(`${label} → renders, no non-finite leak, a11y contract holds`, () => {
        const container = runCase(renderChart(series));
        expect(container.firstElementChild, "renders something").not.toBeNull();
        expectNoNonFiniteLeak(container);
        expectA11yShape(container);
      });
    }
  });
}

/** Apply the scalar matrix to a value-shaped chart (Delta, Bullet, gauges). */
export function valueEdgeSuite(name: string, renderChart: (value: number) => ReactElement): void {
  describe(`<${name}> shared edge matrix (src/test/edge-cases.ts)`, () => {
    for (const [label, value] of Object.entries(EDGE_VALUES)) {
      it(`${label} → renders, no non-finite leak, a11y contract holds`, () => {
        const container = runCase(renderChart(value));
        expect(container.firstElementChild, "renders something").not.toBeNull();
        expectNoNonFiniteLeak(container);
        expectA11yShape(container);
      });
    }
  });
}
