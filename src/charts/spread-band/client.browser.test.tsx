import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { SpreadBand } from "./client.js";

describe("interactive <SpreadBand> (plan/26 §6)", () => {
  it("←/→ steps x announcing the lead at that point", async () => {
    const screen = await render(
      <SpreadBand
        data={[
          { a: 10, b: 12 },
          { a: 14, b: 12 },
          { a: 18, b: 13 },
        ]}
        labels={["Organic", "Paid"]}
        title="Channels"
      />,
    );
    const wrap = screen.container.querySelector(".mc-spread-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 3 of 3: Organic +5 over Paid.");
  });
});
