import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { TimeInRange } from "./client.js";

describe("interactive <TimeInRange> (plan/25 §1)", () => {
  it("←/→ rove zones; each announces its share + a readout chip", async () => {
    const screen = await render(<TimeInRange data={{ below: 9, in: 72, above: 19 }} title="TIR" />);
    const wrap = screen.container.querySelector(".mc-tir-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("in range: 72%.");
    expect(screen.container.querySelector(".mc-spark-readout")?.textContent).toBe("in range 72%");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("below: 9%.");
  });
});
