import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { FoldedDayBand } from "./client.js";

const curve = (h: number) => Math.round(40 + 42 * Math.max(0, 1 - Math.abs(h - 14) / 10));
const DATA = Array.from({ length: 3 }, (_p, p) =>
  Array.from({ length: 24 }, (_h, h) => ({ t: p * 24 + h, value: curve(h) + [-2, 0, 2][p]! })),
).flat();

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <FoldedDayBand>", () => {
  it("←/→ rove fold bins; announce median + middle half", async () => {
    const screen = await render(<FoldedDayBand data={DATA} title="Day" width={200} height={40} />);
    const wrap = screen.container.querySelector(".mc-folded-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/at \d+: median \d+, middle half/);
  });

  it("onActive reports the focused bin; null once cleared", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <FoldedDayBand data={DATA} width={200} height={40} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-folded-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 40, label: "0" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active bin: fires onSelect + pins a mark", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <FoldedDayBand data={DATA} width={200} height={40} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-folded-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 40, label: "0" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('line[data-mc-w="support"]'))
      .not.toBeNull();
  });

  // `bins` and `period` are host-computed config, and this entry labels the
  // fold axis from the RAW props while geometry draws from resolved ones:
  // `bins={1e9}` saturates to 512 and put every bin at position 0, `period`
  // from an empty input field (`Number("")`) announced "at NaN".
  it("hostile bins/period never reach the chip or the live region", async () => {
    const screen = await render(
      <FoldedDayBand data={DATA} bins={1e9} period={NaN} width={200} height={40} />,
    );
    const wrap = screen.container.querySelector(".mc-folded-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^at \d+: median/);
    const chip = screen.container.querySelector(".mc-spark-readout")!;
    expect(chip.textContent).toMatch(/^\d+ · /);
  });

  it("controlled selectedIndex pins the mark without focus", async () => {
    const screen = await render(
      <FoldedDayBand data={DATA} width={200} height={40} selectedIndex={5} />,
    );
    expect(screen.container.querySelector('line[data-mc-w="support"]')).not.toBeNull();
  });
});
