import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { FoldedDayBand } from "./client.js";

const curve = (h: number) => Math.round(40 + 42 * Math.max(0, 1 - Math.abs(h - 14) / 10));
const DATA = Array.from({ length: 3 }, (_p, p) =>
  Array.from({ length: 24 }, (_h, h) => ({ t: p * 24 + h, value: curve(h) + [-2, 0, 2][p]! })),
).flat();

describe("interactive <FoldedDayBand>", () => {
  it("←/→ rove fold bins; announce median + middle half", async () => {
    const screen = await render(<FoldedDayBand data={DATA} title="Day" width={200} height={40} />);
    const wrap = screen.container.querySelector(".mc-folded-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/at \d+: median \d+, middle half/);
  });
});
