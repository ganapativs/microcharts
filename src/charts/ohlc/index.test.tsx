import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Ohlc } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

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
    const up = container.querySelector('[data-mc-ohlc="positive"]')!;
    expect(up.getAttribute("fill")).toContain("--mc-surface"); // hollow
    const down = container.querySelector('[data-mc-ohlc="negative"]')!;
    expect(down.getAttribute("fill")).toContain("--mc-negative"); // filled
    const label = container.querySelector("svg")!.getAttribute("aria-label")!;
    expect(label).toMatch(
      /^20 periods\. Last close [\d,.]+, (up|down) [\d.]+%; range [\d,.]+ to [\d,.]+\.$/,
    );
  });

  it("variant='bars' renders open/close ticks instead of bodies", () => {
    const { container } = draw(<Ohlc data={PERIODS.slice(0, 3)} variant="bars" />);
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
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Ohlc data={PERIODS} title="AAPL daily" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("Ohlc", (data) => (
  <Ohlc
    data={data.map((v) => {
      const b = v ?? Number.NaN;
      return { open: b, high: b + 2, low: b - 2, close: b + 1 };
    })}
    title="Edge"
  />
));
