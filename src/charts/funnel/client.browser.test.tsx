import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Funnel } from "./client.js";

const PIPE = [
  { label: "Visitors", value: 12400 },
  { label: "Signups", value: 5704 },
  { label: "Checkout", value: 2730 },
];

describe("interactive <Funnel> (plan/22 #19)", () => {
  it("←/→ rove stages with retained-share announcements", async () => {
    const screen = await render(<Funnel data={PIPE} title="Pipeline" />);
    const wrap = screen.container.querySelector(".mc-funnel-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Checkout: 2,730 — 22% of Visitors.");
  });
});
