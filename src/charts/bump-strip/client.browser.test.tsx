import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { BumpStrip } from "./client.js";

describe("interactive <BumpStrip> (plan/22 #21)", () => {
  it("←/→ step periods with rank announcements", async () => {
    const screen = await render(<BumpStrip data={[5, 4, 3, 3]} title="Position" />);
    const wrap = screen.container.querySelector(".mc-bump-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Week 2 of 4: #4.");
  });
});
