import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Slope } from "./client.js";

const DATA = [
  { label: "East", from: 48, to: 61 },
  { label: "West", from: 55, to: 41 },
];

describe("interactive <Slope> (plan/22 #13)", () => {
  it("↑/↓ rove categories ordered by `to`, announcing slopes", async () => {
    const screen = await render(<Slope data={DATA} title="Ranks" />);
    const wrap = screen.container.querySelector(".mc-slope-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("East: 48 to 61, up 27%.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("West: 55 to 41, down 25%.");
  });
});
