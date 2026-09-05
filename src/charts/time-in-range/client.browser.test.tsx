import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { TimeInRange } from "./client.js";

describe("interactive <TimeInRange>", () => {
  it("←/→ rove zones from the first; each announces its share + a readout chip", async () => {
    const screen = await render(<TimeInRange data={{ below: 9, in: 72, above: 19 }} title="TIR" />);
    const wrap = screen.container.querySelector(".mc-tir-live") as HTMLElement;
    wrap.focus();
    // First arrow from nothing lands on zone 0 (the kernel contract).
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("below: 9%.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("in range: 72%.");
    expect(screen.container.querySelector(".mc-spark-readout")?.textContent).toBe("in range 72%");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("above: 19%.");
  });

  it("onActive reports the focused datum (zone index + percent + name); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <TimeInRange data={{ below: 9, in: 72, above: 19 }} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-tir-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toMatchObject({ index: 0, value: 9, label: "below" });
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active zone: fires onSelect + pins an outline that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <TimeInRange data={{ below: 9, in: 72, above: 19 }} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-tir-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 1, value: 72, label: "in range" });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the outline with no interaction", async () => {
    const screen = await render(
      <TimeInRange data={{ below: 9, in: 72, above: 19 }} selectedIndex={1} />,
    );
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});

// The geometry lays a separator between every pair of zones, and the hit test
// matched the painted extent only — so a pointer in the gap resolved to no zone
// and the hover outline, the chip and the live region dropped and re-lit at
// every boundary of a sweep.
describe("interactive <TimeInRange> across a separator", () => {
  it("attributes a pointer in the gap to a zone", async () => {
    const screen = await render(
      <TimeInRange data={{ below: 9, in: 72, above: 19 }} width={240} height={20} />,
    );
    const wrap = screen.container.querySelector(".mc-tir-live") as HTMLElement;
    const svg = wrap.querySelector("svg")!;
    const r = svg.getBoundingClientRect();
    const rects = [...svg.querySelectorAll("rect[data-mc-ink], rect[data-mc-cat]")];
    const vbWidth = Number(svg.getAttribute("viewBox")!.split(" ")[2]);
    const a = rects[0]!;
    const b = rects[1]!;
    // Midpoint of the separator between the first two zones, in viewBox units.
    const mid =
      (Number(a.getAttribute("x")) +
        Number(a.getAttribute("width")) +
        Number(b.getAttribute("x"))) /
      2;
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + (mid / vbWidth) * r.width,
        clientY: r.top + r.height / 2,
      }),
    );
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")).not.toBeNull();
  });
});
