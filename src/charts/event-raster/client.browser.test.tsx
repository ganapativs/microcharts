import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { EventRaster } from "./client.js";

const RASTER = [
  { label: "api", events: [2, 5, 9, 14, 20] },
  { label: "db", events: [3, 6, 10] },
];

describe("interactive <EventRaster> (plan/25 §5)", () => {
  it("↓ then → roves lanes and events; announces the event", async () => {
    const screen = await render(
      <EventRaster data={RASTER} title="Events" width={160} height={24} />,
    );
    const wrap = screen.container.querySelector(".mc-raster-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("db, event at 6 (2 of 3).");
  });
});
