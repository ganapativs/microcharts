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
    // The VISIBLE chip carries just the coordinates. It used to repeat both axis
    // names and then the quadrant name — which contains those same two axis
    // names again — for a readout 108px past its cap saying what the dot's own
    // position in the grid already says. The full sentence stays in the live
    // region asserted just above.
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

  it("onActive reports the focused datum (peer index + y value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <QuadrantDot
        data={{ x: 3, y: 9 }}
        field={FIELD}
        width={120}
        height={120}
        onActive={(d) => seen.push(d)}
      />,
    );
    const wrap = screen.container.querySelector(".mc-quadrant-dot-live") as HTMLElement;
    wrap.focus();
    // Ghosts are nearest-first from the focal: peer 0 is {x:2,y:8} → y = 8.
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toEqual({ index: 0, value: 8 });
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active peer: fires onSelect + pins a ring that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <QuadrantDot
        data={{ x: 3, y: 9 }}
        field={FIELD}
        width={120}
        height={120}
        onSelect={(d) => picks.push(d)}
      />,
    );
    const wrap = screen.container.querySelector(".mc-quadrant-dot-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toEqual({ index: 0, value: 8 });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('circle[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(
      <QuadrantDot
        data={{ x: 3, y: 9 }}
        field={FIELD}
        width={120}
        height={120}
        selectedIndex={1}
      />,
    );
    expect(screen.container.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
