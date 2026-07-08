import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ForecastCone } from "./client.js";
import type { ForecastInput } from "./geometry.js";

const HIST = [30, 32, 31, 34, 36, 35, 38];
const FC: ForecastInput = {
  mid: [39, 40, 41, 42],
  p80: [
    [36, 42],
    [35, 45],
    [34, 50],
    [33, 55],
  ],
};

describe("interactive <ForecastCone> (plan/23 #11)", () => {
  it("region-aware: history announces a value, forecast the median + interval", async () => {
    const screen = await render(<ForecastCone data={HIST} forecast={FC} title="Q4" />);
    const wrap = screen.container.querySelector(".mc-forecast-cone-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("week 1: 30.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect
      .poll(() => live.textContent)
      .toBe("week 11 (forecast): median 42, 80% between 33 and 55.");
    // a VISIBLE readout chip pairs median · interval in the forecast region
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("42 · 33–55");
  });

  it("rapid arrow presses don't drop (functional updater)", async () => {
    const screen = await render(<ForecastCone data={HIST} forecast={FC} title="Q4" />);
    const wrap = screen.container.querySelector(".mc-forecast-cone-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("week 3: 31.");
  });
});
