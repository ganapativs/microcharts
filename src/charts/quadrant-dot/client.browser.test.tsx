import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { QuadrantDot } from "./client.js";

const FIELD = [
  { x: 2, y: 8 },
  { x: 8, y: 9 },
  { x: 3, y: 7 },
  { x: 9, y: 2 },
];

describe("interactive <QuadrantDot>", () => {
  it("arrow keys cycle peers nearest-first; each announces coords + quadrant", async () => {
    const screen = await render(
      <QuadrantDot
        data={{ x: 3, y: 9 }}
        field={FIELD}
        split={[5, 5]}
        xLabel="effort"
        yLabel="impact"
        width={120}
        height={120}
        title="Effort vs impact"
      />,
    );
    const wrap = screen.container.querySelector(".mc-quadrant-dot-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect
      .poll(() => live.textContent)
      .toMatch(/^Peer 1 of 4: effort \d+, impact \d+ — (high|low)-impact, (high|low)-effort\.$/);
    // a VISIBLE readout chip pairs the coords
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toMatch(/^\d+, \d+$/);
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toMatch(/^Peer 2 of 4:/);
  });

  it("End jumps to the farthest peer", async () => {
    const screen = await render(
      <QuadrantDot data={{ x: 3, y: 9 }} field={FIELD} width={120} height={120} title="Q" />,
    );
    const wrap = screen.container.querySelector(".mc-quadrant-dot-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^Peer 4 of 4:/);
  });
});
