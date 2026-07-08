import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { StackedArea } from "./client.js";

const TRAFFIC = [
  { label: "Mobile", values: [30, 40, 45] },
  { label: "Web", values: [40, 38, 38] },
  { label: "API", values: [15, 17, 17] },
];

describe("interactive <StackedArea> (plan/22 #23)", () => {
  it("←/→ steps x announcing every layer's share", async () => {
    const screen = await render(<StackedArea data={TRAFFIC} title="Mix" />);
    const wrap = screen.container.querySelector(".mc-stacked-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 3 of 3: Mobile 45%, Web 38%, API 17%.");
  });
});
