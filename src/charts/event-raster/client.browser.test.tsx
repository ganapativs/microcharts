import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
// the stylesheet is loaded here on purpose: the ink roles are what paint these
// lanes, and only a real cascade can tell a stroked mark from a wiped one
import "../../../styles.css";
import { EventRaster as StaticEventRaster } from "./index.js";
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
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 2, label: "api" });
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 5, label: "api" });
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
    expect(picks.at(-1)).toMatchObject({ index: 5, value: 3, label: "db" });
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

  it("roving and the readout stay inside an explicit window", async () => {
    const screen = await render(
      <EventRaster data={RASTER} title="Events" width={160} height={24} domain={[5, 10]} />,
    );
    const wrap = screen.container.querySelector(".mc-raster-live") as HTMLElement;
    // an event the picture drops is not a unit the keyboard may visit
    expect(wrap.getAttribute("aria-label")).toBe("Events. 2 lanes, 4 events; busiest api (2).");
    wrap.focus();
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("api, event at 5 (1 of 2).");
  });

  it("the wrapper name discloses a binned lane, like the static one does", async () => {
    const dense = [{ label: "spam", events: Array.from({ length: 200 }, (_, i) => i) }];
    const screen = await render(<EventRaster data={dense} labels={false} width={60} height={12} />);
    const wrap = screen.container.querySelector(".mc-raster-live") as HTMLElement;
    expect(wrap.getAttribute("aria-label")).toMatch(/spam shown binned\.$/);
  });
});

describe("<EventRaster> lane paint", () => {
  const none = (v: string) => v === "none" || v === "rgba(0, 0, 0, 0)";

  it("emphasis mutes the other lanes — it does not erase them", async () => {
    // `neutral` is fill-only ink: it wiped `stroke` off these zero-area tick
    // verticals and filled nothing, so every non-emphasized lane went blank.
    const screen = await render(
      <StaticEventRaster
        data={[
          { label: "api", events: [2, 5, 9] },
          { label: "db", events: [3, 6] },
        ]}
        emphasis="api"
        width={160}
        height={28}
      />,
    );
    const paths = [...screen.container.querySelectorAll("path")];
    expect(paths.length).toBe(2);
    for (const p of paths) {
      const cs = getComputedStyle(p);
      expect(none(cs.stroke)).toBe(false);
      expect(none(cs.fill)).toBe(true);
      // Chrome hands back `calc(1.5px)` — the token chain, unresolved
      expect(cs.strokeWidth).not.toMatch(/^0(px)?$/);
    }
    // and the two states still read differently
    const [accent, muted] = paths.map((p) => getComputedStyle(p).stroke);
    expect(accent).not.toBe(muted);
  });
});
