import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ConfusionGrid } from "./client.js";

const CATDOG = {
  labels: ["cat", "dog"],
  counts: [
    [88, 12],
    [10, 59],
  ],
};

describe("interactive <ConfusionGrid>", () => {
  it("→ roves cells; announces actual/predicted with row-share phrasing", async () => {
    const screen = await render(<ConfusionGrid data={CATDOG} title="Classifier" size={80} />);
    const wrap = screen.container.querySelector(".mc-confusion-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Actual cat, predicted dog: 12% of cats.");
  });
});
