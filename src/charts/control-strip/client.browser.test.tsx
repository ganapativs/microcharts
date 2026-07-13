import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ControlStrip } from "./client.js";

const SAMPLE = [10, 11, 9, 10, 11, 9, 10, 10, 11, 9, 10, 16];

describe("interactive <ControlStrip>", () => {
  it("arrow keys step points; out points announce which limit was crossed", async () => {
    const screen = await render(<ControlStrip data={SAMPLE} title="Line 3" />);
    const wrap = screen.container.querySelector(".mc-control-strip-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 1 of 12: 10 — in control.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect
      .poll(() => live.textContent)
      .toBe("Point 12 of 12: 16 — above the upper limit (14.85).");
    // a VISIBLE readout chip shows the value
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBe("16");
  });

  it("rapid arrow presses don't drop (functional updater)", async () => {
    const screen = await render(<ControlStrip data={SAMPLE} title="Line 3" />);
    const wrap = screen.container.querySelector(".mc-control-strip-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toContain("Point 3 of 12");
  });
});
