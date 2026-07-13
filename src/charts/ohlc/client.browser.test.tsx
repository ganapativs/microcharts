import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Ohlc } from "./client.js";

const PERIODS = [
  { open: 145.1, high: 149.3, low: 144.0, close: 148.2 },
  { open: 148.2, high: 150.0, low: 147.1, close: 149.5 },
];

describe("interactive <Ohlc>", () => {
  it("←/→ steps periods with full OHLC announcements", async () => {
    const screen = await render(<Ohlc data={PERIODS} title="AAPL" />);
    const wrap = screen.container.querySelector(".mc-ohlc-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect
      .poll(() => live.textContent)
      .toBe("Period 2 of 2: open 148.2, high 150, low 147.1, close 149.5.");
  });
});
