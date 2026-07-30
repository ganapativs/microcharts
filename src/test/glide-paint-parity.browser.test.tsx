// Giving a mark an ink role is what puts it inside the data-change transition —
// and it is also what can repaint it. A role sets `fill` AND `stroke`, and a CSS
// declaration outranks an SVG presentation attribute, so the moment an
// attribute-painted mark takes a role, the role's colours win: a hollow ring
// fills solid, an outlined rect loses its outline. Nothing else in the suite
// sees that. `pnpm test` reads attributes, and the attribute is still sitting
// there in the markup being ignored by the browser; the failure only surfaces in
// an Argos baseline, as a reviewer noticing a blob where a ring used to be.
//
// So this file reads COMPUTED paint, for every mark that was re-plumbed onto the
// inline-style-then-role pattern. Each expectation is the colour the mark
// painted before it had a role. Tokens are resolved through a probe rather than
// hard-coded hexes, so a theme retune moves the test with the library.
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import "../../styles.css";

import { BenchmarkStrip } from "../charts/benchmark-strip/index.js";
import { BurnChart } from "../charts/burn-chart/index.js";
import { CalibrationStrip } from "../charts/calibration-strip/index.js";
import { Dumbbell } from "../charts/dumbbell/index.js";
import { GradedBand } from "../charts/graded-band/index.js";
import { NetFlow } from "../charts/net-flow/index.js";
import { RateVolume } from "../charts/rate-volume/index.js";
import { ShiftHistogram } from "../charts/shift-histogram/index.js";

/** `var(--mc-positive)` as the browser actually resolves it, in this scope. */
function token(within: Element, name: string): string {
  const probe = document.createElement("span");
  probe.style.color = `var(${name})`;
  within.appendChild(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

const isNone = (v: string): boolean => v === "none" || v === "rgba(0, 0, 0, 0)";

/** The mark's painted fill/stroke, plus the root to resolve tokens against. */
function paint(el: Element): { fill: string; stroke: string } {
  const cs = getComputedStyle(el);
  return { fill: cs.fill, stroke: cs.stroke };
}

function root(container: Element): Element {
  const r = container.querySelector(".mc-root");
  if (!r) throw new Error("no .mc-root");
  return r;
}

describe("re-plumbed marks paint exactly what they painted before", () => {
  it("dumbbell's left endpoint stays a hollow ring in data ink", async () => {
    const screen = await render(<Dumbbell data={[{ from: 62000, to: 84000 }]} width={120} />);
    const r = root(screen.container);
    const ring = paint(r.querySelectorAll("circle")[0]!);
    expect(isNone(ring.fill)).toBe(true);
    expect(ring.stroke).toBe(token(r, "--mc-stroke"));
  });

  it("benchmark-strip's focal dot keeps its valence fill and surface halo", async () => {
    const screen = await render(
      <BenchmarkStrip data={[10, 20, 30, 40, 50]} value={45} positive="up" width={120} />,
    );
    const r = root(screen.container);
    const dot = paint(r.querySelector('circle[data-mc-ink="point"]')!);
    expect(dot.fill).toBe(token(r, "--mc-positive"));
    expect(dot.stroke).toBe(token(r, "--mc-surface"));
  });

  it("shift-histogram's overlay after-bins stay OUTLINES, not accent blocks", async () => {
    const screen = await render(
      <ShiftHistogram
        data={{ before: [1, 2, 3, 4, 5, 6], after: [3, 4, 5, 6, 7, 8] }}
        mode="overlay"
        width={120}
      />,
    );
    const r = root(screen.container);
    // Selected by the `fill="none"` attribute the mark declares about itself,
    // not by its role — so swapping the role for one that fills fails on the
    // PAINT here rather than quietly matching nothing.
    const bins = [...r.querySelectorAll('rect[data-mc-origin="bottom"][fill="none"]')];
    expect(bins.length, "overlay mode outlines the after bins").toBeGreaterThan(0);
    for (const bin of bins) {
      const p = paint(bin);
      // This is the whole reason the file exists: `accent` here would fill.
      expect(isNone(p.fill), "an outlined bin must not fill").toBe(true);
      expect(p.stroke).toBe(token(r, "--mc-accent"));
      expect(bin.getAttribute("data-mc-ink"), "and it must still carry a role").not.toBeNull();
    }
  });

  it("rate-volume's low-n ring keeps its surface punch-through", async () => {
    const screen = await render(
      <RateVolume
        data={[
          { rate: 2.3, volume: 120 },
          { rate: 4.1, volume: 38 },
        ]}
        minVolume={50}
        dots="none"
        width={120}
      />,
    );
    const r = root(screen.container);
    const rings = [...r.querySelectorAll('circle[data-mc-ink="data"]')];
    expect(rings.length).toBe(1);
    expect(paint(rings[0]!).fill).toBe(token(r, "--mc-surface"));
    expect(paint(rings[0]!).stroke).toBe(token(r, "--mc-accent"));
  });

  it("calibration-strip's low-support point stays hollow accent", async () => {
    const screen = await render(
      <CalibrationStrip
        data={[
          { predicted: 0.25, observed: 0.24, count: 80 },
          { predicted: 0.95, observed: 0.9, count: 5 },
        ]}
        width={90}
      />,
    );
    const r = root(screen.container);
    const hollow = [...r.querySelectorAll('circle[data-mc-ink="data"]')];
    expect(hollow.length).toBe(1);
    expect(isNone(paint(hollow[0]!).fill)).toBe(true);
    expect(paint(hollow[0]!).stroke).toBe(token(r, "--mc-accent"));
  });

  it("graded-band's observation ring still punches through the band", async () => {
    const screen = await render(
      <GradedBand data={Array.from({ length: 101 }, (_, i) => i)} value={70} width={120} />,
    );
    const r = root(screen.container);
    const dot = paint(r.querySelector('circle[data-mc-ink="data"]')!);
    expect(dot.fill).toBe(token(r, "--mc-surface"));
    expect(dot.stroke).toBe(token(r, "--mc-stroke"));
  });

  it("net-flow's zero rule and burn-chart's today rule keep neutral ink", async () => {
    const flow = await render(
      <NetFlow
        data={[
          { in: 4, out: 3 },
          { in: 5, out: 6 },
        ]}
        width={120}
      />,
    );
    const fr = root(flow.container);
    const zero = paint(fr.querySelector('line[data-mc-ink="muted"]')!);
    expect(zero.stroke).toBe(token(fr, "--mc-neutral"));
    expect(isNone(zero.fill)).toBe(true);

    const burn = await render(
      <BurnChart
        data={{ plan: [40, 30, 20, 10, 0], actual: [40, 38, 36] }}
        width={120}
        height={40}
      />,
    );
    const br = root(burn.container);
    const today = paint(br.querySelector('line[data-mc-ink="muted"]')!);
    expect(today.stroke).toBe(token(br, "--mc-neutral"));
  });
});
