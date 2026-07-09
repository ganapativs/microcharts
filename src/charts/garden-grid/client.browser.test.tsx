import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { GardenGrid } from "./client.js";

const WEEKS = [34, 10, 0, 20, 5, 0, 15, 8, 0, 25, 12, 3];

describe("interactive <GardenGrid> (plan/24 #10)", () => {
  it("keyboard walks the grid and announces the ordinal step", async () => {
    const screen = await render(<GardenGrid data={WEEKS} title="Activity" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(live.textContent).toBe("1 of 12: 34, step 5 of 5.");
    await userEvent.keyboard("{ArrowDown}"); // index 1 = 10
    expect(live.textContent).toBe("2 of 12: 10, step 2 of 5.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<GardenGrid data={WEEKS} unit="weeks" title="Activity" />);
    const wrap = screen.container.querySelector(".mc-garden-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Activity. 12 weeks; peak 34, 9 active.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });
});
