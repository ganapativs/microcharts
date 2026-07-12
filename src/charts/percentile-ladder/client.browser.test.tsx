import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { PercentileLadder } from "./client.js";

const SAMPLE = Array.from({ length: 101 }, (_, i) => i);

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
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBe("p50 50");
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
});
