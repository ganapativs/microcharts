import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { CalibrationStrip } from "./client.js";

const BINS = [
  { predicted: 0.2, observed: 0.18, count: 100 },
  { predicted: 0.5, observed: 0.55, count: 80 },
  { predicted: 0.8, observed: 0.62, count: 40 },
];

describe("interactive <CalibrationStrip> (plan/25 §14)", () => {
  it("←/→ rove bins; announces predicted, observed, support", async () => {
    const screen = await render(
      <CalibrationStrip data={BINS} minSupport={10} title="Calib" width={160} height={32} />,
    );
    const wrap = screen.container.querySelector(".mc-calib-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("predicted 0.5, observed 0.55, 80 samples.");
  });
});
