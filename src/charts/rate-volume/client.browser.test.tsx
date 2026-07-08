import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { RateVolume } from "./client.js";
import type { RateVolumePoint } from "./geometry.js";

const SAMPLE: RateVolumePoint[] = [
  { rate: 2.3, volume: 120 },
  { rate: 3.1, volume: 90 },
  { rate: 2.8, volume: 140 },
  { rate: 4.1, volume: 38 },
];

describe("interactive <RateVolume> (plan/23 #5)", () => {
  it("arrow keys step periods; the live region always pairs both numbers", async () => {
    const screen = await render(<RateVolume data={SAMPLE} minVolume={50} title="Rate" />);
    const wrap = screen.container.querySelector(".mc-rate-volume-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Period 1 of 4: 2.3 on 120 events.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Period 4 of 4: 4.1 on 38 events (low volume).");
    // crosshair rendered for the active period
    expect(wrap.querySelectorAll("svg line").length).toBeGreaterThanOrEqual(1);
  });

  it("rapid arrow presses don't drop (functional updater)", async () => {
    const screen = await render(<RateVolume data={SAMPLE} title="Rate" />);
    const wrap = screen.container.querySelector(".mc-rate-volume-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toContain("Period 3 of 4");
  });

  it("a zero-volume period announces no events (never a rate)", async () => {
    const data: RateVolumePoint[] = [
      { rate: 2, volume: 100 },
      { rate: 9, volume: 0 },
      { rate: 3, volume: 80 },
    ];
    const screen = await render(<RateVolume data={data} title="Rate" />);
    const wrap = screen.container.querySelector(".mc-rate-volume-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Period 2 of 3: no events.");
  });
});
