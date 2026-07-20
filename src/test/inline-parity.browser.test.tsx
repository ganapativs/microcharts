// `.mc-inline` static/interactive box parity, measured in a real browser.
//
// Switching a chart to `/interactive` must add interaction and change NOTHING
// about the space it takes on a line. Two ways that broke, both shipped:
//
//   1. `.mc-inline > .mc-trend` was a DIRECT-CHILD rule. The interactive
//      wrapper span sits between `.mc-inline` and the SVG, so the rule stopped
//      matching and TrendArrow rendered 39×16 instead of 15.2×15.2.
//   2. `wrap()` puts the consumer's `style` on the WRAPPER while `FILL` pinned
//      the SVG to `height: auto` — so `height: 1.2em` shrank the wrapper and
//      left the mark at its authored pixel size, overflowing the line. SparkBar
//      at 220×32 went 131.9×19.2 static → 220×32 interactive.
//
// The static-analysis gate (interactive-fill-contract.test.ts) proves each
// entry CALLS `fillFor(style)`; this proves the result is actually the same box.
// Charts here are chosen one per wrapper shape: a series chart, a bar chart, a
// glyph sized by a CSS rule, and a square `size`-prop chart.
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import type { ReactElement } from "react";

import "../../styles.css";

import { Sparkline as StaticSparkline } from "../charts/sparkline/index.js";
import { Sparkline as LiveSparkline } from "../charts/sparkline/client.js";
import { SparkBar as StaticSparkBar } from "../charts/sparkbar/index.js";
import { SparkBar as LiveSparkBar } from "../charts/sparkbar/client.js";
import { TrendArrow as StaticTrendArrow } from "../charts/trend-arrow/index.js";
import { TrendArrow as LiveTrendArrow } from "../charts/trend-arrow/client.js";
import { StarSpoke as StaticStarSpoke } from "../charts/star-spoke/index.js";
import { StarSpoke as LiveStarSpoke } from "../charts/star-spoke/client.js";

const WAVE = [12, 13, 12.4, 14, 15.2, 14.8, 16, 17.5, 17, 18.4, 19, 21];
const SPOKES = [
  { label: "Speed", value: 0.8 },
  { label: "Cost", value: 0.4 },
  { label: "Scale", value: 0.6 },
];

/** Each case renders the same props through both entries. */
const CASES: Record<string, (live: boolean, style?: object) => ReactElement> = {
  sparkline: (live, style) =>
    live ? (
      <LiveSparkline data={WAVE} width={220} height={32} style={style} />
    ) : (
      <StaticSparkline data={WAVE} width={220} height={32} style={style} />
    ),
  sparkbar: (live, style) =>
    live ? (
      <LiveSparkBar data={WAVE} width={220} height={32} style={style} />
    ) : (
      <StaticSparkBar data={WAVE} width={220} height={32} style={style} />
    ),
  // Sized by a `.mc-inline` CSS rule rather than by props — the direct-child bug.
  "trend-arrow": (live, style) =>
    live ? (
      <LiveTrendArrow value={0.12} style={style} />
    ) : (
      <StaticTrendArrow value={0.12} style={style} />
    ),
  "star-spoke": (live, style) =>
    live ? (
      <LiveStarSpoke data={SPOKES} size={80} style={style} />
    ) : (
      <StaticStarSpoke data={SPOKES} size={80} style={style} />
    ),
};

async function boxes(ui: ReactElement): Promise<{ host: DOMRect; svg: DOMRect }> {
  const screen = await render(
    <p style={{ margin: 0, font: "16px/1.6 Georgia, serif" }}>
      Latency <span className="mc-inline">{ui}</span> held steady.
    </p>,
  );
  const host = screen.container.querySelector(".mc-inline") as HTMLElement;
  const svg = host.querySelector("svg") as SVGSVGElement;
  return { host: host.getBoundingClientRect(), svg: svg.getBoundingClientRect() };
}

const near = (a: number, b: number): void => expect(Math.abs(a - b)).toBeLessThan(0.5);

describe(".mc-inline: the interactive twin occupies the static twin's box", () => {
  for (const [name, make] of Object.entries(CASES)) {
    it(`${name}: sized by props`, async () => {
      const s = await boxes(make(false));
      const l = await boxes(make(true));
      near(s.svg.width, l.svg.width);
      near(s.svg.height, l.svg.height);
      near(s.host.width, l.host.width);
      near(s.host.height, l.host.height);
    });

    it(`${name}: sized by CSS (height: 1.2em)`, async () => {
      // The reported blocker: a CSS-sized inline chart grew when switched to
      // /interactive because the SVG never learned the height.
      const style = { height: "1.2em", width: "auto" };
      const s = await boxes(make(false, style));
      const l = await boxes(make(true, style));
      near(s.svg.width, l.svg.width);
      near(s.svg.height, l.svg.height);
    });
  }
});
