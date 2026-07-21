// Valence/accent ink is element-split: filled marks fill, open strokes stroke.
// Both rule families use `:where()` (zero specificity), so cascade order + the
// path[fill="none"] opt-in are load-bearing — a regression silently erases
// dumbbell connectors and queue-depth breach paths (`stroke: none` wins).
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import "../../styles.css";

import { Dumbbell } from "../charts/dumbbell/index.js";
import { QueueDepth } from "../charts/queue-depth/index.js";
import { DepthWedge } from "../charts/depth-wedge/index.js";
import { Waterfall } from "../charts/waterfall/index.js";

const none = (v: string) => v === "none" || v === "rgba(0, 0, 0, 0)";

describe("ink element-split (stroke vs fill)", () => {
  it("dumbbell connector with positive strokes, does not fill", async () => {
    const screen = await render(
      <Dumbbell data={[{ from: 48, to: 68 }]} positive="up" width={120} height={20} />,
    );
    const line = screen.container.querySelector("line[data-mc-ink='positive']") as SVGLineElement;
    expect(line).toBeTruthy();
    const cs = getComputedStyle(line);
    expect(cs.stroke).not.toBe("none");
    expect(none(cs.fill)).toBe(true);
  });

  it("queue-depth breach path[fill=none] strokes negative", async () => {
    const screen = await render(
      <QueueDepth data={[2, 4, 9, 11, 8]} capacity={7} width={120} height={28} />,
    );
    const path = screen.container.querySelector(
      'path[data-mc-ink="negative"][fill="none"]',
    ) as SVGPathElement;
    expect(path).toBeTruthy();
    expect(getComputedStyle(path).stroke).not.toBe("none");
  });

  it("depth-wedge filled paths keep valence fill (no stroke wipe)", async () => {
    const screen = await render(
      <DepthWedge
        data={{
          demand: [
            { level: 99.9, amount: 500 },
            { level: 99.5, amount: 300 },
          ],
          supply: [
            { level: 100.1, amount: 300 },
            { level: 100.5, amount: 200 },
          ],
        }}
        width={80}
        height={40}
      />,
    );
    const path = screen.container.querySelector('path[data-mc-ink="positive"]') as SVGPathElement;
    expect(path).toBeTruthy();
    expect(path.getAttribute("fill")).not.toBe("none");
    const cs = getComputedStyle(path);
    expect(none(cs.fill)).toBe(false);
    expect(none(cs.stroke)).toBe(true);
  });

  it("waterfall bars still fill positive/negative", async () => {
    const screen = await render(
      <Waterfall
        data={[
          { label: "Up", value: 4 },
          { label: "Down", value: -2 },
        ]}
        width={120}
        height={40}
      />,
    );
    const bar = screen.container.querySelector('rect[data-mc-ink="positive"]') as SVGRectElement;
    expect(bar).toBeTruthy();
    expect(none(getComputedStyle(bar).fill)).toBe(false);
    expect(none(getComputedStyle(bar).stroke)).toBe(true);
  });
});
