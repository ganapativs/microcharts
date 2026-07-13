import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Horizon } from "./client.js";

describe("interactive <Horizon>", () => {
  it("announces the TRUE value, not the band", async () => {
    const screen = await render(<Horizon data={[5, -12, 96, 40]} title="Load" />);
    const wrap = screen.container.querySelector(".mc-horizon-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 2 of 4: -12.");
  });
});
