import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { PairedBars } from "./client.js";

const DATA = [
  { label: "East", value: 940, ref: 1200 },
  { label: "West", value: 410, ref: 400 },
];

describe("interactive <PairedBars> (plan/22 #12)", () => {
  it("arrow keys rove pairs with vs announcements", async () => {
    const screen = await render(<PairedBars data={DATA} title="Budget" />);
    const wrap = screen.container.querySelector(".mc-paired-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("West: 410 vs 400.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("East: 940 vs 1,200.");
  });
});
