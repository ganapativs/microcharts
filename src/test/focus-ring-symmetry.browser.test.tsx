// A focus / selection ring must sit CONCENTRIC around the marks it encloses:
// equal gap left and right, equal gap top and bottom.
//
// The way this breaks is always the same — the ring is derived from the BAND
// (`i * pitch`, width `pitch`) instead of from what geometry actually paints, so
// it inherits the band's slack on one side only and reads visibly off-centre.
// Two shipped instances:
//
//   1. `paired-bars` grouped mode: the value bar sat at `start` (width `half`)
//      and the slimmer ref bar ended at `start + 1.85 * half` inside a `2 * half`
//      band, so the pair was flush-left with all the slack trailing.
//   2. `sprout-row`: the ring was a fixed `r=7` circle at `baselineY - 5`. Tuned
//      at height 20, it rode 10px above a seed glyph at height 36.
//
// Method: activate a unit by keyboard, find the overlay ring, and compare it to
// the at-rest marks that unit paints — attributed by POSITION (marks sorted by
// x, chunked per unit), never by "whatever bbox happens to fall inside the
// ring". Bbox containment is what a hand-rolled sweep does, and it silently
// unions a neighbouring connector or an overlapping trail dot into the
// comparison, reporting asymmetry that isn't there.
//
// Measured with `getBBox()` — user-space, stroke-free — so ring stroke width and
// device pixel ratio can't move the numbers. Only an axis where the ring is
// TIGHT is judged: a ring spanning ~the whole plot on an axis is a BAND ring (a
// bar growing from the floor inside a full-height band) and its asymmetry there
// is by design.
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { ReactElement } from "react";

import "../../styles.css";

import { PairedBars } from "../charts/paired-bars/client.js";
import { SproutRow } from "../charts/sprout-row/client.js";
import { CometTrail } from "../charts/comet-trail/client.js";
import { Funnel } from "../charts/funnel/client.js";
import { BalanceBeam } from "../charts/balance-beam/client.js";
import { Waterfall } from "../charts/waterfall/client.js";

const SPROUT = [
  { label: "Alpha", value: 0 },
  { label: "Bravo", value: 1 },
  { label: "Charlie", value: 2 },
  { label: "Delta", value: 3 },
];
const PAIRS = [
  { label: "Mon", value: 12, ref: 9 },
  { label: "Tue", value: 8, ref: 11 },
  { label: "Wed", value: 15, ref: 13 },
];
const FUNNEL = [
  { label: "Visits", value: 12400 },
  { label: "Signups", value: 3200 },
  { label: "Trials", value: 900 },
  { label: "Paid", value: 260 },
];
const FLOW = [
  { label: "New", value: 820 },
  { label: "Expansion", value: 260 },
  { label: "Churn", value: -310 },
  { label: "Refunds", value: -140 },
];
const TRAIL = [12, 13, 12.4, 14, 15.2, 14.8, 16, 17.5, 17, 18.4];

interface Case {
  ui: ReactElement;
  /** Units to probe. */
  units: number[];
  /** At-rest marks, in visual left→right order; chunked `per` to a unit. */
  markSel: string;
  per?: number;
  /** Keys that move focus onto unit `i` from a fresh mount. */
  keys?: (i: number) => string[];
}

const rove = (i: number): string[] => Array<string>(i + 1).fill("ArrowRight");

const CASES: Record<string, Case> = {
  // The original report. Grouped mode centres the pair in its band.
  "paired-bars grouped": {
    ui: <PairedBars data={PAIRS} mode="grouped" width={220} height={44} />,
    units: [0, 1, 2],
    markSel: "rect[data-mc-ink]",
    per: 2,
  },
  // A fixed-radius ring only lands on the glyph at one height.
  "sprout-row @20": {
    ui: <SproutRow data={SPROUT} height={20} />,
    units: [0, 1, 2, 3],
    markSel: 'path[data-mc-ink="point"]',
  },
  "sprout-row @36": {
    ui: <SproutRow data={SPROUT} height={36} />,
    units: [0, 1, 2, 3],
    markSel: 'path[data-mc-ink="point"]',
  },
  "sprout-row @36 with labels": {
    ui: <SproutRow data={SPROUT} height={36} labels />,
    units: [0, 1, 2, 3],
    markSel: 'path[data-mc-ink="point"]',
  },
  "comet-trail": {
    ui: <CometTrail data={TRAIL} width={200} height={40} />,
    units: [0, 4, 9],
    markSel: "circle[data-mc-ink]",
  },
  // Column charts: the ring is a full-height band vertically (exempt) and must
  // hug the painted column horizontally.
  funnel: {
    ui: <Funnel data={FUNNEL} width={220} height={66} />,
    units: [0, 1, 2, 3],
    markSel: "rect[data-mc-ink]",
  },
  waterfall: {
    ui: <Waterfall data={FLOW} width={220} height={30} label="none" />,
    // 4 steps + the total column. `label="none"` keeps viewH === height so the
    // full-column band ring spans the viewBox and skips the concentric-y check
    // (with default `label="delta"` the label band makes the ring look asymmetric).
    units: [0, 1, 2, 3, 4],
    markSel: "rect[data-mc-ink]",
  },
  // Two pans; ←/→ are absolute sides here, not relative steps.
  "balance-beam": {
    ui: (
      <BalanceBeam
        data={[
          { label: "In", value: 620 },
          { label: "Out", value: 480 },
        ]}
        width={120}
        height={44}
      />
    ),
    units: [0, 1],
    markSel: "rect[data-mc-ink]",
    keys: (i) => [i === 0 ? "ArrowLeft" : "ArrowRight"],
  },
};

/** A box in the SVG's own user space — stroke-free, resolution-independent. */
interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
const boxOf = (el: SVGGraphicsElement): Box => {
  const b = el.getBBox();
  return { x0: b.x, y0: b.y, x1: b.x + b.width, y1: b.y + b.height };
};
const union = (bs: Box[]): Box => ({
  x0: Math.min(...bs.map((b) => b.x0)),
  y0: Math.min(...bs.map((b) => b.y0)),
  x1: Math.max(...bs.map((b) => b.x1)),
  y1: Math.max(...bs.map((b) => b.y1)),
});

const press = (el: HTMLElement, k: string): void => {
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
};

/** Anything that would move or resize a ring over time. */
const GEOMETRY_PROPS = new Set([
  "all",
  "x",
  "y",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "width",
  "height",
  "x1",
  "y1",
  "x2",
  "y2",
  "d",
  "transform",
  "translate",
]);

/**
 * Geometry properties this element would animate over a non-zero duration.
 * `transition-property` alone says nothing — its initial value is `all` with a
 * 0s duration, so the two lists have to be read together.
 */
const lerpedGeometry = (el: Element): string[] => {
  const cs = getComputedStyle(el);
  const props = cs.transitionProperty.split(",").map((p) => p.trim());
  const durs = cs.transitionDuration.split(",").map((d) => parseFloat(d) || 0);
  return props.filter((p, i) => GEOMETRY_PROPS.has(p) && (durs[i % durs.length] ?? 0) > 0);
};

/** Gaps that were actually asserted — proves the suite isn't vacuous. */
let judged = 0;

describe("focus rings sit concentric on the marks they enclose", () => {
  for (const [name, c] of Object.entries(CASES)) {
    it(name, async () => {
      const screen = await render(c.ui);
      const host = screen.container.querySelector("[role='img'][tabindex]") as HTMLElement;
      const svg = host.querySelector("svg") as SVGSVGElement;
      const vb = svg.viewBox.baseVal;
      const per = c.per ?? 1;

      // At-rest marks, left→right. Captured BEFORE any ring exists so an overlay
      // can never be mistaken for a mark.
      const marks = [...svg.querySelectorAll<SVGGraphicsElement>(c.markSel)]
        .map((el) => ({ el, b: boxOf(el) }))
        .sort((a, b) => a.b.x0 + a.b.x1 - (b.b.x0 + b.b.x1));
      expect(marks.length).toBeGreaterThanOrEqual((Math.max(...c.units) + 1) * per);
      expect(marks.length % per).toBe(0);

      for (const i of c.units) {
        host.focus();
        for (const k of (c.keys ?? rove)(i)) press(host, k);

        const find = (): SVGGraphicsElement | null =>
          svg.querySelector<SVGGraphicsElement>("[data-mc-w][data-mc-active]");
        // React flushes the keydown asynchronously under the test runner.
        await vi.waitFor(() => expect(find(), `${name}: no ring for unit ${i}`).not.toBeNull());
        const r = boxOf(find()!);
        const m = union(marks.slice(i * per, i * per + per).map((x) => x.b));

        const where = `${name} unit ${i}`;
        // A ring must SNAP to the unit it names. BalanceBeam's live-retilt rule
        // (`.mc-beam-live :is(line, rect, circle)`) also matched the overlay, so
        // roving pans lerped the ring across the whole beam — off-centre by up
        // to the beam's width for the length of the transition.
        expect(
          lerpedGeometry(find()!),
          `${where}: the ring transitions its own geometry — it will trail the focus`,
        ).toEqual([]);
        // Tight axes only: a ring spanning ~the whole plot on an axis is a band
        // ring and makes no claim to hug the marks there.
        if (r.x1 - r.x0 < vb.width * 0.9) {
          expect(
            Math.abs(m.x0 - r.x0 - (r.x1 - m.x1)),
            `${where}: left gap ${(m.x0 - r.x0).toFixed(2)} vs right gap ${(r.x1 - m.x1).toFixed(2)}`,
          ).toBeLessThanOrEqual(1);
          judged++;
        }
        if (r.y1 - r.y0 < vb.height * 0.9) {
          expect(
            Math.abs(m.y0 - r.y0 - (r.y1 - m.y1)),
            `${where}: top gap ${(m.y0 - r.y0).toFixed(2)} vs bottom gap ${(r.y1 - m.y1).toFixed(2)}`,
          ).toBeLessThanOrEqual(1);
          judged++;
        }
        // The ring must actually enclose its marks — a "symmetric" ring that
        // cuts through the mark on both sides is not a pass.
        expect(
          m.x0 >= r.x0 - 0.01 && m.x1 <= r.x1 + 0.01,
          `${where}: ring clips its marks in x`,
        ).toBe(true);

        press(host, "Escape");
        host.blur();
      }
    });
  }

  it("judged a real number of axes (guards against a vacuous suite)", () => {
    expect(judged).toBeGreaterThan(30);
  });

  // The BRANDED ring, as opposed to the symmetric overlay rings above.
  // `styles.css` styled `.mc-root:focus-visible` — the <svg> — but no static
  // sets tabIndex: the tab stop is the wrapper span that `wrap()` stamps with
  // `data-mc-host`. So the rule could never match and all ~104 focusable charts
  // fell back to the UA outline, whatever that is on the host platform.
  it("the accent focus ring lands on the element that actually takes focus", async () => {
    const screen = await render(<CometTrail data={[3, 6, 2, 8, 5]} title="Focus" />);
    const host = screen.container.querySelector("[data-mc-host]") as HTMLElement;
    host.focus();
    expect(host.matches(":focus"), "the wrapper is the tab stop").toBe(true);

    // Resolve --mc-accent through the cascade rather than hardcoding a hex.
    const probe = document.createElement("span");
    probe.style.color = "var(--mc-accent)";
    host.append(probe);
    const accent = getComputedStyle(probe).color;
    probe.remove();

    const cs = getComputedStyle(host);
    expect(cs.outlineStyle).toBe("solid");
    expect(cs.outlineWidth).toBe("2px");
    expect(cs.outlineColor).toBe(accent);
  });
});
