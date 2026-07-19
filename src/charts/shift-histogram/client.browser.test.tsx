import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ShiftHistogram } from "./client.js";

const MS = (n: number) => `${Math.round(n)} ms`;
const BEFORE = Array.from({ length: 100 }, (_, i) => 120 + (i % 40) - 20);
const AFTER = Array.from({ length: 100 }, (_, i) => 96 + (i % 40) - 20);
const DATA = { before: BEFORE, after: AFTER };

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

const mount = async (extra: Record<string, unknown> = {}) => {
  const screen = await render(
    <ShiftHistogram data={DATA} format={MS} width={200} title="Fix" {...extra} />,
  );
  return {
    screen,
    wrap: screen.container.querySelector(".mc-shift-histogram-live") as HTMLElement,
  };
};

describe("interactive <ShiftHistogram>", () => {
  it("arrow keys step bins; each announces before/after proportions", async () => {
    const { wrap } = await mount();
    wrap.focus();
    key(wrap, "Home");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/ms.* ms: \d+% before, \d+% after\.$/);
    // a VISIBLE readout chip pairs the two proportions
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toMatch(/%\s*\/\s*.*%/);
  });

  it("M jumps to a median bin", async () => {
    const { wrap } = await mount();
    wrap.focus();
    key(wrap, "M");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/before, \d+% after\.$/);
  });

  it("onActive reports the focused bin (bin index + shift); null once cleared", async () => {
    const seen: { index: number; value: number | null }[] = [];
    const { wrap } = await mount({ onActive: (d: unknown) => seen.push(d as never) });
    wrap.focus();
    key(wrap, "Home");
    // index is the shared BIN index; value is the bin's after−before shift.
    expect(seen.at(-1)).toMatchObject({ index: 0 });
    expect(typeof seen.at(-1)!.value).toBe("number");
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active bin: fires onSelect + pins an outline", async () => {
    const picks: unknown[] = [];
    const { screen, wrap } = await mount({ onSelect: (d: unknown) => picks.push(d) });
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 0 });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the outline without focus", async () => {
    const { screen } = await mount({ selectedIndex: 2 });
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
