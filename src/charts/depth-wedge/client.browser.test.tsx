import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { DepthWedge } from "./client.js";

const BOOK = {
  demand: [
    { level: 99.5, amount: 400 },
    { level: 99, amount: 200 },
  ],
  supply: [
    { level: 100.5, amount: 300 },
    { level: 101, amount: 150 },
  ],
};

describe("interactive <DepthWedge> (plan/25 §12)", () => {
  it("→ walks levels; announces the cumulative depth on a side", async () => {
    const screen = await render(<DepthWedge data={BOOK} title="Book" width={160} height={24} />);
    const wrap = screen.container.querySelector(".mc-depth-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/(demand|supply): .+ within .+ of mid\./);
  });
});
