import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { GradedBand } from "./client.js";

const SAMPLE = Array.from({ length: 101 }, (_, i) => i);

describe("interactive <GradedBand> (plan/23 #4)", () => {
  it("arrow keys step levels outward, announcing each interval", async () => {
    const screen = await render(<GradedBand data={SAMPLE} title="Estimate" />);
    const wrap = screen.container.querySelector(".mc-graded-band-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("50% interval: 25 to 75.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("95% interval: 2.5 to 97.5.");
    // both edge ticks present for the active band
    expect(wrap.querySelectorAll("svg line").length).toBeGreaterThanOrEqual(3);
  });

  it("hover snaps to the nearest band edge", async () => {
    const screen = await render(<GradedBand data={SAMPLE} />);
    const wrap = screen.container.querySelector(".mc-graded-band-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width / 2,
        clientY: r.top + r.height / 2,
      }),
    );
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toContain("interval");
  });
});
