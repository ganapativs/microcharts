import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ABStrips } from "./client.js";

const A = Array.from({ length: 60 }, (_, i) => 130 + ((i * 7) % 30) - 15);
const B = Array.from({ length: 60 }, (_, i) => 118 + ((i * 7) % 30) - 15);

describe("interactive <ABStrips>", () => {
  it("arrows: ↓ picks row B, → steps edges; median announces the delta", async () => {
    const screen = await render(<ABStrips data={{ a: A, b: B }} title="A/B" />);
    const wrap = screen.container.querySelector(".mc-ab-strips-live") as HTMLElement;
    wrap.focus();
    // ↓ picks row B and lands on the median edge by default
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^B median [\d.]+, [\d.]+ below A\.$/);
    // readout chip present
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBeTruthy();
  });

  it("a non-median edge announces the percentile", async () => {
    const screen = await render(<ABStrips data={{ a: A, b: B }} title="A/B" />);
    const wrap = screen.container.querySelector(".mc-ab-strips-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    for (let i = 0; i < 4; i++)
      wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^B p95: [\d.]+\.$/);
  });
});
