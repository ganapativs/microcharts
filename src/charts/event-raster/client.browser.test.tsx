import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { EventRaster } from "./client.js";

const RASTER = [
  { label: "api", events: [2, 5, 9, 14, 20] },
  { label: "db", events: [3, 6, 10] },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <EventRaster>", () => {
  it("↓ then → roves lanes and events; announces the event", async () => {
    const screen = await render(
      <EventRaster data={RASTER} title="Events" width={160} height={24} />,
    );
    const wrap = screen.container.querySelector(".mc-raster-live") as HTMLElement;
    wrap.focus();
    // First arrow lands on unit 0 (the first lane's first event); the second ↓
    // moves down a lane.
    key(wrap, "ArrowDown");
    key(wrap, "ArrowDown");
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("db, event at 6 (2 of 3).");
  });

  it("onActive reports the focused event; null once cleared", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <EventRaster data={RASTER} width={160} height={24} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-raster-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toEqual({ index: 0, value: 2, label: "api" });
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toEqual({ index: 1, value: 5, label: "api" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active event: fires onSelect + pins a mark", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <EventRaster data={RASTER} width={160} height={24} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-raster-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    key(wrap, "ArrowDown");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 5, value: 3, label: "db" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('line[data-mc-w="support"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the mark without focus", async () => {
    const screen = await render(
      <EventRaster data={RASTER} width={160} height={24} selectedIndex={6} />,
    );
    expect(screen.container.querySelector('line[data-mc-w="support"]')).not.toBeNull();
  });
});
