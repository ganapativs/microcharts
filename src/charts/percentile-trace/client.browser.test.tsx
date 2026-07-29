import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { PercentileTrace } from "./client.js";

const SAMPLE = [42, 48, 55, 61, 68, 74, 79, 81];

describe("interactive <PercentileTrace>", () => {
  it("arrow keys step readings; announces the percentile at each", async () => {
    const screen = await render(<PercentileTrace data={SAMPLE} unit="week" title="Cohort" />);
    const wrap = screen.container.querySelector(".mc-percentile-trace-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("week 0: p42");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("week 7: p81");
    // a VISIBLE readout chip shows the percentile at the focused reading
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("week 7: p81");
    expect(wrap.querySelectorAll("svg line").length).toBeGreaterThanOrEqual(1);
  });

  it("ArrowRight advances one reading at a time", async () => {
    const screen = await render(<PercentileTrace data={SAMPLE} unit="week" title="Cohort" />);
    const wrap = screen.container.querySelector(".mc-percentile-trace-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("week 1: p48");
  });

  it("onActive reports the focused datum (data index + percentile); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<PercentileTrace data={SAMPLE} onActive={(d) => seen.push(d)} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}");
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 48 });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active reading: fires onSelect + pins a persistent ring", async () => {
    const picks: unknown[] = [];
    const screen = await render(<PercentileTrace data={SAMPLE} onSelect={(d) => picks.push(d)} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}{Enter}");
    expect(picks.at(-1)).toMatchObject({ index: 1, value: 48 });
    // Pin survives blur (it is selection, not hover).
    fig.blur();
    await expect.poll(() => fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the ring with no interaction", async () => {
    const screen = await render(<PercentileTrace data={SAMPLE} selectedIndex={3} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  // The chip is rendered text, so it is a localizable surface. It used to be an
  // inline `${unit} ${index}: ${value}` template — a `strings` bundle
  // translated what a screen reader heard and not what a sighted reader saw.
  it("a localized bundle reaches the visible chip, not just the announcement", async () => {
    const strings = {
      noData: "Keine Daten.",
      percentileValue: (n: string) => `P${n}`,
      percentileTrace: (c: string, d: string, b: string) => `${c}, ${d}; ${b}.`,
      percentileDelta: (dir: "up" | "down", a: string) => `${dir} ${a}`,
      percentileFlat: "unverändert",
      percentileBand: () => "mittleres Halb",
      percentileTraceAt: (unit: string, i: number, v: string) => `${v} in ${unit} ${i}`,
    };
    const screen = await render(
      <PercentileTrace data={SAMPLE} unit="Woche" strings={strings} title="Kohorte" />,
    );
    const wrap = screen.container.querySelector(".mc-percentile-trace-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("P81 in Woche 7");
    expect(document.querySelector('[aria-live="polite"]')!.textContent).toBe("P81 in Woche 7");
  });

  // The box is a host input: a non-finite one used to reach the hit-test math,
  // so the crosshair landed on a plot the static never drew.
  it("a non-finite width still hit-tests against the box the static drew", async () => {
    const screen = await render(<PercentileTrace data={SAMPLE} width={Number.NaN} />);
    const wrap = screen.container.querySelector(".mc-percentile-trace-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => wrap.querySelector("svg line")).not.toBeNull();
    const x = wrap.querySelector("svg line")!.getAttribute("x1")!;
    expect(Number.isFinite(Number(x))).toBe(true);
  });
});
