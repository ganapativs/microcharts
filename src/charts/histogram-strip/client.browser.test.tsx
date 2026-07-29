import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { HistogramStrip } from "./client.js";

const VALUES = [1, 1, 1, 5, 5, 9];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <HistogramStrip>", () => {
  it("←/→ rove bins with range announcements", async () => {
    const screen = await render(<HistogramStrip data={VALUES} bins={3} title="Dist" />);
    const wrap = screen.container.querySelector(".mc-histogram-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    // First arrow lands on the FIRST bin (shared kernel), which holds three 1s.
    await expect.poll(() => live.textContent).toMatch(/^\d+(\.\d+)? to \d+(\.\d+)?: 3 values\.$/);
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toMatch(/^\d+(\.\d+)? to \d+(\.\d+)?: 2 values\.$/);
  });

  it("visible readout chip shows the bin's range and count, not just count", async () => {
    const screen = await render(<HistogramStrip data={VALUES} bins={3} />);
    const wrap = screen.container.querySelector(".mc-histogram-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    await expect
      .poll(() => screen.container.querySelector(".mc-spark-readout")?.textContent)
      .toMatch(/^\d+(\.\d+)?–\d+(\.\d+)?: 3$/);
  });

  it("onActive reports the focused bin (bin index + count); null once cleared", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <HistogramStrip data={VALUES} bins={3} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-histogram-live") as HTMLElement;
    wrap.focus();
    key(wrap, "End");
    // index is the BIN index, value the bin's count.
    expect(seen.at(-1)).toMatchObject({ index: 2, value: 1 });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active bin: fires onSelect + pins an outline", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <HistogramStrip data={VALUES} bins={3} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-histogram-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 3 });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  // Mirrors BAR_SELECTOR in client.tsx. The marked bin carries `accent`, so the
  // default `rise` selector ("bar" only) would leave exactly one bin standing
  // still while the rest rose.
  it("the entrance selector covers every painted bin, marked one included", async () => {
    const screen = await render(<HistogramStrip data={VALUES} bins={3} markValue={5} />);
    const svg = screen.container.querySelector("svg")!;
    const painted = svg.querySelectorAll("rect[data-mc-ink]");
    const covered = svg.querySelectorAll(
      'rect[data-mc-ink="bar"], rect[data-mc-ink="accent"]',
    ).length;
    expect(svg.querySelectorAll('rect[data-mc-ink="accent"]').length).toBe(1);
    expect(covered).toBe(painted.length);
  });

  it("controlled selectedIndex pins the outline without focus", async () => {
    const screen = await render(<HistogramStrip data={VALUES} bins={3} selectedIndex={1} />);
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
