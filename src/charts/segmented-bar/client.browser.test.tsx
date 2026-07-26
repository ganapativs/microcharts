import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { SegmentedBar } from "./client.js";

const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
  { label: "Edge", value: 30 },
  { label: "Arc", value: 12 },
  { label: "Brave", value: 8 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <SegmentedBar>", () => {
  it("←/→ rove segments from the first; Other announces its rolled-up total and member count", async () => {
    const screen = await render(<SegmentedBar data={MIX} title="Share" />);
    const wrap = screen.container.querySelector(".mc-segbar-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Chrome: 62%, 620.");
    key(wrap, "End");
    await expect.poll(() => live.textContent).toBe("Other: 2%, 20 over 2 categories.");
  });

  it("Enter selects the active segment: fires onSelect + pins an outline", async () => {
    const picks: unknown[] = [];
    const screen = await render(<SegmentedBar data={MIX} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-segbar-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 620, label: "Chrome" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the outline without focus", async () => {
    const screen = await render(<SegmentedBar data={MIX} selectedIndex={1} />);
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
