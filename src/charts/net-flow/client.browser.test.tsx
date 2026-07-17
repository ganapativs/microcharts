import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { NetFlow } from "./client.js";
import type { NetFlowPeriod } from "./geometry.js";

const SAMPLE: NetFlowPeriod[] = [
  { in: 4, out: 3 },
  { in: 5, out: 4 },
  { in: 6, out: 4 },
  { in: 5, out: 6 },
  { in: 7, out: 5 },
];

describe("interactive <NetFlow>", () => {
  it("arrow keys step periods; the live region gives in, out, and signed net", async () => {
    const screen = await render(<NetFlow data={SAMPLE} title="Cash flow" />);
    const wrap = screen.container.querySelector(".mc-net-flow-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Period 1 of 5: in 4, out 3, net +1.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Period 5 of 5: in 7, out 5, net +2.");
    expect(wrap.querySelectorAll("svg line").length).toBeGreaterThanOrEqual(1); // baseline + crosshair
    // a VISIBLE readout chip shows in / out · net at the focused period
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("7 / 5 · +2");
  });

  it("a net-negative period states the negative sign in text", async () => {
    const screen = await render(<NetFlow data={SAMPLE} title="Cash flow" />);
    const wrap = screen.container.querySelector(".mc-net-flow-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    for (let i = 0; i < 3; i++)
      wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Period 4 of 5: in 5, out 6, net -1.");
  });

  // Regression: the crosshair line and readout chip must share the same
  // gutter-aware width basis. The static reserves a right gutter for the "last"
  // net label (viewBox wider than `width`); if the client recomputes geometry
  // without that gutter, its `totalWidth` is short and the readout % runs ahead
  // of the viewBox-drawn crosshair.
  it("crosshair line and readout chip share the gutter-aware width basis", async () => {
    const screen = await render(<NetFlow data={SAMPLE} title="Cash flow" />);
    const wrap = screen.container.querySelector(".mc-net-flow-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")).not.toBeNull();
    const svg = wrap.querySelector("svg")!;
    const vbWidth = Number(svg.getAttribute("viewBox")!.split(" ")[2]);
    const line = [...svg.querySelectorAll("line")].find(
      (l) => l.getAttribute("x1") === l.getAttribute("x2"),
    )!; // the vertical crosshair (not the horizontal baseline)
    const lineFrac = Number(line.getAttribute("x1")) / vbWidth;
    const chip = wrap.querySelector(".mc-spark-readout") as HTMLElement;
    const chipFrac = parseFloat(chip.style.left) / 100;
    expect(Math.abs(lineFrac - chipFrac)).toBeLessThan(0.01);
  });
});
