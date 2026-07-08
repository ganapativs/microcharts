import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { RugStrip } from "./client.js";

const DATA = [3.1, 5.2, 9.7, 4.4];

describe("interactive <RugStrip> (plan/22 #5)", () => {
  it("arrow keys step through sorted observations with rank announcements", async () => {
    const screen = await render(<RugStrip data={DATA} title="Values" />);
    const wrap = screen.container.querySelector(".mc-rug-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("4.4 — 2nd of 4.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("9.7 — 4th of 4.");
  });

  it("hover finds the nearest tick and shows the readout", async () => {
    const screen = await render(<RugStrip data={DATA} />);
    const wrap = screen.container.querySelector(".mc-rug-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width - 1, // far right → nearest = max value
        clientY: r.top + r.height / 2,
      }),
    );
    await expect.poll(() => document.querySelector(".mc-spark-readout")?.textContent).toBe("9.7");
  });
});
