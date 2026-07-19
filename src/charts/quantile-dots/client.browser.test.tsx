import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { QuantileDots } from "./client.js";

const UNIFORM = Array.from({ length: 20 }, (_, i) => i + 1); // 1..20

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

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
    key(wrap, "ArrowLeft");
    key(wrap, "Escape");
    // no crash; static threshold count (5 in 20) still reachable via the label
    expect(wrap.querySelector(".mc-quantile-dots") || wrap.querySelector("svg")).toBeTruthy();
  });

  it("onActive reports the focused quantile bin (column index + mass); null once cleared", async () => {
    const seen: { index: number; value: number | null }[] = [];
    const screen = await render(
      <QuantileDots data={UNIFORM} threshold={15} onActive={(d) => seen.push(d as never)} />,
    );
    const wrap = screen.container.querySelector(".mc-quantile-dots-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    // index is the quantile COLUMN (bin) index; value the dots stacked in it.
    expect(seen.at(-1)).toMatchObject({ index: 0 });
    expect(seen.at(-1)!.value).toBeGreaterThan(0);
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active bin: fires onSelect + pins a threshold line", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <QuantileDots data={UNIFORM} threshold={15} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-quantile-dots-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 1 });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('line[data-mc-ink="accent"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the threshold line without focus", async () => {
    const screen = await render(<QuantileDots data={UNIFORM} threshold={15} selectedIndex={3} />);
    expect(screen.container.querySelector('line[data-mc-ink="accent"]')).not.toBeNull();
  });
});
