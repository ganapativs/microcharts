import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Ohlc } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const PERIODS = Array.from({ length: 20 }, (_, i) => {
  const base = 143 + Math.sin(i / 3) * 4 + i * 0.25;
  return {
    open: Math.round(base * 100) / 100,
    high: Math.round((base + 2.1) * 100) / 100,
    low: Math.round((base - 1.9) * 100) / 100,
    close: Math.round((base + (i % 3 === 0 ? -1.2 : 1.4)) * 100) / 100,
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<Ohlc>", () => {
  it("wick + body per period; hollow up / filled down; summary shape", () => {
    const { container } = draw(<Ohlc data={PERIODS} />);
    expect(container.querySelectorAll("rect").length).toBe(20); // one candle body per period
    // The shape code, read where each half of it now lives: the hollow up-body
    // states its surface fill inline (an attribute would lose to its own ink
    // role), and the filled down-body IS the role — `data-mc-ink="negative"`
    // resolves to `fill: var(--mc-negative); stroke: none`.
    const up = container.querySelector('[data-mc-ohlc="positive"]')!;
    expect(up.getAttribute("style")).toContain("--mc-surface"); // hollow
    expect(up.getAttribute("data-mc-ink")).toBe("positive");
    const down = container.querySelector('[data-mc-ohlc="negative"]')!;
    expect(down.getAttribute("data-mc-ink")).toBe("negative"); // filled
    expect(down.getAttribute("style")).toBeNull();
    const label = container.querySelector("svg")!.getAttribute("aria-label")!;
    expect(label).toMatch(
      /^20 periods\. Last close [\d,.]+, (up|down) [\d.]+%; range [\d,.]+ to [\d,.]+\.$/,
    );
  });

  it("mode='bars' renders open/close ticks instead of bodies", () => {
    const { container } = draw(<Ohlc data={PERIODS.slice(0, 3)} mode="bars" />);
    expect(container.querySelector("rect")).toBeNull();
    expect(container.querySelectorAll("line").length).toBe(9); // 3 × (wick + 2 ticks)
  });

  it("corrupt data → dev warning + refused", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(<Ohlc data={[{ open: 10, high: 8, low: 12, close: 9 }]} />);
    expect(container.querySelectorAll("rect").length).toBe(0);
    expect(warn).toHaveBeenCalled();
  });

  it("> maxPeriods renders the most recent N + dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const many = Array.from({ length: 30 }, (_, i) => ({
      open: i,
      high: i + 2,
      low: Math.max(0, i - 1),
      close: i + 1,
    }));
    const { container } = draw(<Ohlc data={many} />);
    expect(container.querySelectorAll("rect").length).toBe(20); // one candle body per rendered period
    expect(warn).toHaveBeenCalled();
    // The sentence reads the PAINTED window. Summarising all 30 announced a
    // count, a change and a range covering candles that are not on the chart.
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "20 periods. Last close 30, up 200%; range 9 to 31.",
    );
  });

  it("maxPeriods below 1 paints one period and says so", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(<Ohlc data={PERIODS} maxPeriods={0} />);
    expect(container.querySelectorAll("rect").length).toBe(1);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toMatch(/^1 periods\./);
    expect(warn).toHaveBeenCalled();
  });

  it("label='last' names the last PAINTED close, never a refused period's price", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const data = [
      { open: 100, high: 102, low: 99, close: 101 },
      { open: 101, high: 104, low: 100, close: 103 },
      // corrupt (high < low): refused by geometry, so its 9 must not appear in
      // the gutter — a price with no candle under it, contradicting the summary.
      { open: 10, high: 8, low: 12, close: 9 },
    ];
    const { container } = draw(<Ohlc data={data} label="last" width={120} height={24} />);
    expect(container.querySelectorAll("rect").length).toBe(2);
    expect(container.querySelector("text")!.textContent).toBe("103");
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain("Last close 103");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Ohlc data={PERIODS} title="AAPL daily" />);
    await expectNoA11yViolations(container);
  });
});

// All four prices are encoded (wick ends + body ends), so the matrix runs once
// per price with the other three finite and forming a realistic band. The
// previous spelling derived all four from one value (`b`, `b+2`, `b-2`, `b+1`),
// so every period stayed internally consistent and the validity check
// (`high >= low`, open/close inside the range) was never asked a real question —
// and `?? 0` turned an unquoted period into a period that traded at zero.
//
// The band [2, 9] is chosen so a useful share of matrix values land inside it and
// actually draw, while the rest exercise the refusal path. `label="last"` renders
// the last close: that gutter is the numeral-leak surface.
const ohlcCase = (data: readonly { open: number; high: number; low: number; close: number }[]) => (
  <Ohlc data={data} title="Edge" label="last" width={120} height={24} />
);
mappedEdgeSuite(
  "Ohlc (degenerate open)",
  (v) => ({ open: v as number, high: 9, low: 2, close: 4 }),
  ohlcCase,
);
mappedEdgeSuite(
  "Ohlc (degenerate high)",
  (v) => ({ open: 3, high: v as number, low: 2, close: 4 }),
  ohlcCase,
);
mappedEdgeSuite(
  "Ohlc (degenerate low)",
  (v) => ({ open: 3, high: 9, low: v as number, close: 4 }),
  ohlcCase,
);
mappedEdgeSuite(
  "Ohlc (degenerate close)",
  (v) => ({ open: 3, high: 9, low: 2, close: v as number }),
  ohlcCase,
);
