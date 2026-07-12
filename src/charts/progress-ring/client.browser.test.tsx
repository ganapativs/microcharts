import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ProgressRing } from "./client.js";

describe("interactive <ProgressRing>", () => {
  it("announces only at quarter-threshold crossings", async () => {
    const screen = await render(<ProgressRing value={0.2} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    await screen.rerender(<ProgressRing value={0.23} />); // no crossing
    expect(live.textContent).toBe("");
    await screen.rerender(<ProgressRing value={0.55} />); // crossed 25 + 50
    await expect.poll(() => live.textContent).toBe("55% complete.");
  });

  it("sweep announces remaining", async () => {
    const screen = await render(<ProgressRing value={0.2} sweep />);
    await screen.rerender(<ProgressRing value={0.8} sweep />);
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("20% remaining.");
  });
});
