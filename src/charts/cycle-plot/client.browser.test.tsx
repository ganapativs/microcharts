import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { CyclePlot } from "./client.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKS: number[] = [];
for (let w = 0; w < 6; w++) WEEKS.push(38, 40 + w * 2, 45, 48, 52, 61, 44);

describe("interactive <CyclePlot>", () => {
  it("←/→ step slots, announcing the center + drift; a readout chip shows the value", async () => {
    const screen = await render(
      <CyclePlot
        data={WEEKS}
        period={7}
        slots={DAYS}
        cycleUnit="weeks"
        width={168}
        height={40}
        title="Weekly shape"
      />,
    );
    const wrap = screen.container.querySelector(".mc-cycle-plot-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Sun: mean 38 across 6 weeks, steady.");
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBe("38");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toMatch(/^Mon: mean \d+ across 6 weeks, rising\.$/);
  });

  it("↑/↓ step cycles within the focused slot, announcing observations", async () => {
    const screen = await render(
      <CyclePlot
        data={WEEKS}
        period={7}
        slots={DAYS}
        cycleUnit="weeks"
        width={168}
        height={40}
        title="Weekly shape"
      />,
    );
    const wrap = screen.container.querySelector(".mc-cycle-plot-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true })); // Sun
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); // Mon
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })); // cycle 1
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^Mon, cycle 1 of 6: \d+\.$/);
  });
});
