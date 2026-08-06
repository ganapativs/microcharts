// The readout chip, measured inside layouts that used to eat it.
//
// This suite exists because of a consumer bug report with a photograph
// attached: a coverage strip in a scrolling side rail, its readout showing as a
// sliver. The chip was `position: absolute; bottom: 100%`, and an absolutely
// positioned box is clipped by ANY ancestor whose `overflow` is not `visible` —
// seven nested clipping boxes sat above that one strip. `bottom: 100%` is also
// unconditional, so a chart near the top of the window opened its chip
// off-screen, and nothing clamped it horizontally either: a chart against the
// right edge pushed its chip past the edge instead of letting it grow leftward.
//
// `readout-containment.browser.test.tsx` could not catch any of that. It asks
// whether the TEXT fits the chip (`scrollWidth > clientWidth`); a chip can pass
// that test perfectly while being invisible behind a scroll container. The
// question here is the other one: does the chip reach the reader's eye.
//
// So each case wraps a real interactive chart in a real hostile layout and
// measures the painted rectangle against every clipping ancestor AND the
// window. The chip is allowed to overhang its chart — that is what a tooltip
// does — but it is never allowed to be cut, and never allowed off-screen.
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import type { ReactElement, ReactNode } from "react";

import "../../styles.css";

import { Sparkline } from "../charts/sparkline/client.js";
import { SegmentedBar } from "../charts/segmented-bar/client.js";
import { Bullet } from "../charts/bullet/client.js";
import { Slope } from "../charts/slope/client.js";
import { Sparkline as StaticSparkline } from "../charts/sparkline/index.js";
import { Bullet as StaticBullet } from "../charts/bullet/index.js";
import { SegmentedBar as StaticSegmentedBar } from "../charts/segmented-bar/index.js";

const SERIES = [12, 18, 9, 24, 31, 22, 28, 35, 30, 41, 38, 44];

/** One chart per readout shape: crosshair series, band strip, scalar, rows. */
const CHARTS: Record<string, () => ReactElement> = {
  sparkline: () => <Sparkline data={SERIES} />,
  "segmented-bar": () => (
    <SegmentedBar
      data={[
        { label: "Desktop", value: 52 },
        { label: "Mobile", value: 31 },
        { label: "Tablet", value: 17 },
      ]}
      height={8}
    />
  ),
  bullet: () => <Bullet value={72} target={80} />,
  slope: () => (
    <Slope
      data={[
        { label: "north", from: 55.7, to: 27.5 },
        { label: "south", from: 29, to: 14 },
      ]}
      width={120}
      height={40}
    />
  ),
};

/**
 * Hostile layouts. `fixed` is how a case reaches a window edge — the test
 * container itself sits wherever the runner put it, so an edge case has to
 * position itself against the viewport rather than hope.
 */
const LAYOUTS: Record<string, (kid: ReactNode) => ReactElement> = {
  "overflow-hidden": (kid) => (
    <div style={{ width: 140, height: 30, overflow: "hidden" }}>{kid}</div>
  ),
  "overflow-scroll": (kid) => (
    <div style={{ width: 140, height: 30, overflowY: "auto" }}>
      {kid}
      <div style={{ height: 200 }} />
    </div>
  ),
  // the reported shape: a rail of nested clippers above one chart
  "nested-clippers": (kid) => {
    let node: ReactNode = kid;
    for (let i = 0; i < 7; i++) node = <div style={{ overflow: "hidden" }}>{node}</div>;
    return <div style={{ width: 200, height: 40, overflowY: "auto" }}>{node}</div>;
  },
  // a containing block for fixed descendants — only the top layer escapes this
  "transform-ancestor": (kid) => (
    <div style={{ transform: "translateX(0)", width: 140, height: 30, overflow: "hidden" }}>
      {kid}
    </div>
  ),
  "contain-paint": (kid) => <div style={{ contain: "paint", width: 140, height: 30 }}>{kid}</div>,
  "edge-top": (kid) => <div style={{ position: "fixed", top: 0, left: "45%" }}>{kid}</div>,
  "edge-right": (kid) => <div style={{ position: "fixed", top: "50%", right: 0 }}>{kid}</div>,
  "edge-left": (kid) => <div style={{ position: "fixed", top: "50%", left: 0 }}>{kid}</div>,
  "edge-bottom": (kid) => <div style={{ position: "fixed", bottom: 0, left: "45%" }}>{kid}</div>,
};

interface Verdict {
  /** Fraction of the chip's own area that survives every clip. 1 = whole. */
  visible: number;
  /** Positive on any side = the chip crossed that window edge. */
  offscreen: number;
  /** Horizontal overlap with the chart, in px. 0 = the chip floated away. */
  overlap: number;
  /** Chip sits clear of the mark rather than on top of it. */
  adjacent: boolean;
  text: string;
}

function measure(chip: HTMLElement, host: HTMLElement): Verdict {
  const c = chip.getBoundingClientRect();
  const h = host.getBoundingClientRect();
  const area = Math.max(1, c.width * c.height);
  let x0 = c.left;
  let y0 = c.top;
  let x1 = c.right;
  let y1 = c.bottom;
  // A chip in the top layer is out of the ancestors' reach by definition —
  // walking them would subtract clips that no longer apply to it.
  if (!chip.matches(":popover-open")) {
    for (let p = chip.parentElement; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      const clips =
        /hidden|clip|auto|scroll/.test(cs.overflowX + cs.overflowY) ||
        /paint|strict|content/.test(cs.contain);
      if (!clips) continue;
      const r = p.getBoundingClientRect();
      x0 = Math.max(x0, r.left);
      y0 = Math.max(y0, r.top);
      x1 = Math.min(x1, r.right);
      y1 = Math.min(y1, r.bottom);
    }
  }
  const vx0 = Math.max(x0, 0);
  const vy0 = Math.max(y0, 0);
  const vx1 = Math.min(x1, window.innerWidth);
  const vy1 = Math.min(y1, window.innerHeight);
  return {
    visible: (Math.max(0, vx1 - vx0) * Math.max(0, vy1 - vy0)) / area,
    offscreen: Math.max(
      c.right - window.innerWidth,
      -c.left,
      c.bottom - window.innerHeight,
      -c.top,
    ),
    // Escaping the clippers is only half the job: a chip that reaches the top
    // layer but is placed by the UA (centred in the window) is unclipped and
    // useless. It has to stay attached to the mark it names.
    overlap: Math.max(0, Math.min(c.right, h.right) - Math.max(c.left, h.left)),
    adjacent: c.bottom <= h.top + 2 || c.top >= h.bottom - 2,
    text: (chip.textContent ?? "").trim(),
  };
}

const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe("readout escapes hostile layouts", () => {
  for (const [chartName, makeChart] of Object.entries(CHARTS)) {
    for (const [layoutName, wrapLayout] of Object.entries(LAYOUTS)) {
      it(`${chartName} in ${layoutName} — chip is whole and on screen`, async () => {
        const screen = await render(wrapLayout(makeChart()));
        const host = screen.container.querySelector<HTMLElement>('span[role="img"][tabindex]');
        expect(host, "interactive host wrapper").not.toBeNull();

        // Keyboard, not pointer: a chart inside a clipper may be scrolled out of
        // the pointer's reach, and focus opens the same chip.
        host!.focus();
        const seen: Verdict[] = [];
        for (let i = 0; i < 4; i++) {
          host!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
          await settle();
          const chip = host!.querySelector<HTMLElement>(".mc-spark-readout");
          if (chip && (chip.textContent ?? "").trim()) seen.push(measure(chip, host!));
        }

        // Non-vacuity: "nothing was clipped" is worthless if nothing appeared.
        expect(seen.length, "roving surfaced at least one readout").toBeGreaterThan(0);

        const cut = seen.filter((v) => v.visible < 0.99);
        const out = seen.filter((v) => v.offscreen > 0.5);
        expect(
          cut,
          cut.length
            ? `chip clipped to ${Math.round(cut[0]!.visible * 100)}% of itself ("${cut[0]!.text}")`
            : "",
        ).toEqual([]);
        expect(
          out,
          out.length ? `chip crossed a window edge by ${out[0]!.offscreen.toFixed(1)}px` : "",
        ).toEqual([]);

        const adrift = seen.filter((v) => v.overlap <= 0);
        expect(
          adrift,
          adrift.length ? `chip floated off its chart ("${adrift[0]!.text}")` : "",
        ).toEqual([]);
        const onTop = seen.filter((v) => !v.adjacent);
        expect(onTop, onTop.length ? `chip covers the mark it names` : "").toEqual([]);
      });
    }
  }
});

// The other half of the report: a chart told to fill its container used to paint
// at its intrinsic size, centred, with dead space either side — `width` came
// from CSS but `height` stayed on the attribute, so `preserveAspectRatio` fitted
// the drawing to the SHORTER axis. Measured: an 80x6 bullet painting 80px wide
// inside a 335px rail, which reads as a chart that failed to load.
describe("a chart fills the box it is given", () => {
  // A CLASS, not an inline style: the report is `className="block w-full"`, and
  // a class is exactly what the old code could not honour — an inline width
  // would have beaten the `height` attribute's axis anyway.
  const fill = (): (() => void) => {
    const tag = document.createElement("style");
    tag.textContent = ".mc-test-fill { display: block; width: 100%; }";
    document.head.append(tag);
    return () => tag.remove();
  };

  const cases: [string, ReactElement][] = [
    ["sparkline", <StaticSparkline key="s" data={SERIES} className="mc-test-fill" />],
    ["bullet", <StaticBullet key="b" value={72} target={80} className="mc-test-fill" />],
    [
      "segmented-bar",
      <StaticSegmentedBar
        key="g"
        data={[
          { label: "A", value: 60 },
          { label: "B", value: 40 },
        ]}
        height={8}
        className="mc-test-fill"
      />,
    ],
  ];
  for (const [name, el] of cases) {
    it(`${name} — a CSS class paints edge to edge, no letterbox`, async () => {
      const undo = fill();
      try {
        const screen = await render(<div style={{ width: 335 }}>{el}</div>);
        const svg = screen.container.querySelector("svg.mc-root") as SVGSVGElement;
        await settle();
        const box = svg.getBoundingClientRect();
        const vb = (svg.getAttribute("viewBox") ?? "0 0 1 1").split(/\s+/).map(Number);
        // What `preserveAspectRatio="xMidYMid meet"` actually paints: the viewBox
        // scaled by the SMALLER of the two ratios, centred in the element box.
        const scale = Math.min(box.width / vb[2]!, box.height / vb[3]!);
        const deadSpace = box.width - vb[2]! * scale;
        expect(Math.round(box.width), "element stretched to the container").toBe(335);
        expect(
          deadSpace,
          `${Math.round(deadSpace)}px of the 335px box is empty — the drawing is letterboxed`,
        ).toBeLessThan(2);
      } finally {
        undo();
      }
    });
  }

  it("a chart never overflows a container narrower than itself", async () => {
    const screen = await render(
      <div style={{ width: 40 }}>
        <StaticSparkline data={SERIES} />
      </div>,
    );
    const svg = screen.container.querySelector("svg.mc-root") as SVGSVGElement;
    await settle();
    // 80 units of chart, 40px of room: it has to shrink, not spill.
    expect(svg.getBoundingClientRect().width).toBeLessThanOrEqual(40.5);
  });
});
