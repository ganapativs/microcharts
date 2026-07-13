import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { DualSparkline } from "./client.js";

describe("interactive <DualSparkline>", () => {
  it("←/→ steps x announcing both series", async () => {
    const screen = await render(
      <DualSparkline data={[12, 15, 17]} compare={[12, 14, 15]} title="You vs plan" />,
    );
    const wrap = screen.container.querySelector(".mc-dual-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 3 of 3: 17 vs 15.");
  });
});
