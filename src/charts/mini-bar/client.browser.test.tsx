import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { MiniBar } from "./client.js";

const DATA = [
  { label: "East", value: 940 },
  { label: "West", value: 410 },
  { label: "South", value: 620 },
  { label: "North", value: 120 },
];

describe("interactive <MiniBar> (plan/22 #6)", () => {
  it("arrow keys rove bars with rank announcements + focus ring", async () => {
    const screen = await render(<MiniBar data={DATA} title="Sales" />);
    const wrap = screen.container.querySelector(".mc-minibar-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("West: 410 — 3rd of 4.");
    expect(wrap.querySelectorAll("svg rect").length).toBe(5); // 4 bars + ring
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("East: 940 — 1st of 4.");
  });

  it("hover finds the bar by band lookup and shows its value", async () => {
    const screen = await render(<MiniBar data={DATA} />);
    const wrap = screen.container.querySelector(".mc-minibar-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + 2, // first band
        clientY: r.top + r.height / 2,
      }),
    );
    await expect.poll(() => document.querySelector(".mc-spark-readout")?.textContent).toBe("940");
  });
});
