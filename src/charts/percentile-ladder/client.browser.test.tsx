import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { PercentileLadder } from "./client.js";

const SAMPLE = Array.from({ length: 101 }, (_, i) => i);

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <PercentileLadder>", () => {
  it("arrow keys step ticks; each states its multiple of the median", async () => {
    const screen = await render(<PercentileLadder data={SAMPLE} title="Latency" />);
    const wrap = screen.container.querySelector(".mc-percentile-ladder-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("p99: 99 — 2× the median.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("p50: 50 — 1× the median.");
    // a VISIBLE readout chip shows the tick's percentile + value
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("p50 50 (1×)");
    expect(wrap.querySelectorAll("svg line").length).toBeGreaterThanOrEqual(2);
  });

  it("hover snaps to the nearest tick", async () => {
    const screen = await render(<PercentileLadder data={SAMPLE} />);
    const wrap = screen.container.querySelector(".mc-percentile-ladder-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width - 2,
        clientY: r.top + r.height / 2,
      }),
    );
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toContain("p99");
  });

  it("onActive reports the focused rung; null on Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(<PercentileLadder data={SAMPLE} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-percentile-ladder-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 50, label: "p50" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active rung: fires onSelect + pins the probe", async () => {
    const picks: unknown[] = [];
    const screen = await render(<PercentileLadder data={SAMPLE} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-percentile-ladder-live") as HTMLElement;
    wrap.focus();
    key(wrap, "End");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 2, value: 99, label: "p99" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('line[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("a constant series paints one rung, so only one unit roves", async () => {
    // p50 = p90 = p99 → geometry collapses to a single painted tick. Three
    // navigable units would cycle the chip through the percentiles while the
    // probe line never moved.
    const seen: unknown[] = [];
    const screen = await render(
      <PercentileLadder data={[7, 7, 7, 7, 7]} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-percentile-ladder-live") as HTMLElement;
    wrap.focus();
    key(wrap, "End");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 7, label: "p50" });
    key(wrap, "ArrowRight");
    // Already at the only unit: the rove is a no-op, not a jump to a hidden rung.
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 7, label: "p50" });
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("p50 7 (1×)");
  });

  it("controlled selectedIndex pins the probe without focus", async () => {
    const screen = await render(<PercentileLadder data={SAMPLE} selectedIndex={1} />);
    expect(screen.container.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });
});
