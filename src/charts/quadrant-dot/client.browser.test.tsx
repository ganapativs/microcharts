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
  it("Home focuses the focal; arrows then cycle peers nearest-first", async () => {
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
      .toMatch(/^Impact 9, effort 3 — in the (high|low)-impact, (high|low)-effort quadrant\.$/);
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toMatch(/^\d+, \d+$/);
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect
      .poll(() => live.textContent)
      .toMatch(/^Peer 1 of 4: effort \d+, impact \d+ — (high|low)-impact, (high|low)-effort\.$/);
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
    // targets = [focal, ...4 peers] → End = index 4 → Peer 4 of 4
    await expect.poll(() => live.textContent).toMatch(/^Peer 4 of 4:/);
  });

  it("onActive reports the focused datum (focal=0, then peers); null on clear", async () => {
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
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toMatchObject({ index: 0, value: 9 });
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    // First peer nearest the focal: {x:2,y:8} → y = 8 at index 1.
    await expect.poll(() => seen.at(-1)).toMatchObject({ index: 1, value: 8 });
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
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 1, value: 8 });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('circle[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("a pointer near the focal picks it and shows the chip", async () => {
    const screen = await render(
      <QuadrantDot
        data={{ x: 5, y: 5 }}
        field={[{ x: 9, y: 9 }]}
        xDomain={[0, 10]}
        domain={[0, 10]}
        width={64}
        height={64}
      />,
    );
    const wrap = screen.container.querySelector(".mc-quadrant-dot-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    // Focal at centre; always-nearest from a point closer to the focal than the peer.
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width * 0.5,
        clientY: r.top + r.height * 0.5,
      }),
    );
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBe("5, 5");
  });

  it("a pointer nearer a peer than the focal picks that peer", async () => {
    const screen = await render(
      <QuadrantDot
        data={{ x: 0, y: 0 }}
        field={[{ x: 5, y: 5 }]}
        xDomain={[0, 10]}
        domain={[0, 10]}
        width={64}
        height={64}
      />,
    );
    const wrap = screen.container.querySelector(".mc-quadrant-dot-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + (32 / 64) * r.width,
        clientY: r.top + (32 / 64) * r.height,
      }),
    );
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBe("5, 5");
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
