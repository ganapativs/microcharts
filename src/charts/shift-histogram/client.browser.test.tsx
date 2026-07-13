import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ShiftHistogram } from "./client.js";

const MS = (n: number) => `${Math.round(n)} ms`;
const BEFORE = Array.from({ length: 100 }, (_, i) => 120 + (i % 40) - 20);
const AFTER = Array.from({ length: 100 }, (_, i) => 96 + (i % 40) - 20);

describe("interactive <ShiftHistogram>", () => {
  it("arrow keys step bins; each announces before/after proportions", async () => {
    const screen = await render(
      <ShiftHistogram
        data={{ before: BEFORE, after: AFTER }}
        format={MS}
        width={200}
        title="Fix"
      />,
    );
    const wrap = screen.container.querySelector(".mc-shift-histogram-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/ms.* ms: \d+% before, \d+% after\.$/);
    // a VISIBLE readout chip pairs the two proportions
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toMatch(/%\s*\/\s*.*%/);
  });

  it("M jumps to a median bin", async () => {
    const screen = await render(
      <ShiftHistogram
        data={{ before: BEFORE, after: AFTER }}
        format={MS}
        width={200}
        title="Fix"
      />,
    );
    const wrap = screen.container.querySelector(".mc-shift-histogram-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "M", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/before, \d+% after\.$/);
  });
});
