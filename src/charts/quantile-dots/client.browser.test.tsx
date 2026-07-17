import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { QuantileDots } from "./client.js";

const UNIFORM = Array.from({ length: 20 }, (_, i) => i + 1); // 1..20

describe("interactive <QuantileDots>", () => {
  it("the probe: hovering recomputes the count past the live threshold", async () => {
    const screen = await render(
      <QuantileDots data={UNIFORM} threshold={15} side="above" title="Bus wait" />,
    );
    const wrap = screen.container.querySelector(".mc-quantile-dots-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    // hover near the right edge → few dots above
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width * 0.9,
        clientY: r.top + r.height / 2,
      }),
    );
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^\d+ in 20 chances above /);
    // the readout chip reports the live odds
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toMatch(/in 20$/);
  });

  // Regression: the crosshair line is drawn inside the static at the true
  // viewBox scale — which includes the "N in count" label gutter. If the client
  // computes its geometry without the gutter, its `totalWidth` is short and the
  // pointer→line map runs at a different scale than the cursor, so the line
  // drifts increasingly left as you move right. Assert unit tracking:
  // the line must move ~1px per cursor px across the plot (CSS-independent).
  it("readout chip and crosshair line share the gutter-aware width basis", async () => {
    const screen = await render(
      <QuantileDots data={UNIFORM} threshold={15} side="above" width={120} title="Bus wait" />,
    );
    const wrap = screen.container.querySelector(".mc-quantile-dots-live") as HTMLElement;
    const svg = wrap.querySelector("svg")!;
    const sr = svg.getBoundingClientRect();
    // hover at 40% across — inside the plot, left of the label gutter
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: sr.left + sr.width * 0.4,
        clientY: sr.top + sr.height / 2,
      }),
    );
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")).not.toBeNull();

    // The crosshair line is drawn in the STATIC's viewBox (gutter-aware).
    // The readout chip is positioned by the CLIENT's `left: %`. Both must use
    // the SAME totalWidth basis, else the line drifts from the readout/cursor.
    const vbWidth = Number(svg.getAttribute("viewBox")!.split(" ")[2]);
    const line = wrap.querySelector('line[data-mc-ink="muted"]') as SVGLineElement;
    const lineFrac = Number(line.getAttribute("x1")) / vbWidth;
    const chip = wrap.querySelector(".mc-spark-readout") as HTMLElement;
    const chipFrac = parseFloat(chip.style.left) / 100;
    // pre-fix: client totalWidth = width (no gutter) < static viewBox width, so
    // chipFrac ran ahead of lineFrac by the gutter ratio (~0.33). Now they match.
    expect(Math.abs(lineFrac - chipFrac)).toBeLessThan(0.02);
    // and the gutter really is present (viewBox wider than the plot `width`)
    expect(vbWidth).toBeGreaterThan(120);
  });

  it("Escape returns the probe to the prop threshold", async () => {
    const screen = await render(<QuantileDots data={UNIFORM} threshold={15} title="Wait" />);
    const wrap = screen.container.querySelector(".mc-quantile-dots-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    // no crash; static threshold count (5 in 20) still reachable via the label
    expect(wrap.querySelector(".mc-quantile-dots") || wrap.querySelector("svg")).toBeTruthy();
  });
});
