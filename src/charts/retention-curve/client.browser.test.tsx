import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { RetentionCurve } from "./client.js";

const SAMPLE = [1, 0.71, 0.52, 0.43, 0.37, 0.344, 0.341, 0.34];
const BENCH = [1, 0.6, 0.44, 0.37, 0.33, 0.3, 0.29, 0.28];

describe("interactive <RetentionCurve>", () => {
  it("arrow keys step periods; announces retention and benchmark", async () => {
    const screen = await render(
      <RetentionCurve data={SAMPLE} benchmark={BENCH} unit="week" title="Cohort" />,
    );
    const wrap = screen.container.querySelector(".mc-retention-curve-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("week 0: 100% retained (benchmark 100%).");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("week 7: 34% retained (benchmark 28%).");
    expect(wrap.querySelectorAll("svg line").length).toBeGreaterThanOrEqual(1);
    // a VISIBLE readout chip shows retention · benchmark at the focused period
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      // The x position IS the period, and `unit` defaulted to the English "week".
      .toBe("34% · 28%");
  });

  it("without a benchmark, no benchmark clause", async () => {
    const screen = await render(<RetentionCurve data={SAMPLE} unit="week" title="Cohort" />);
    const wrap = screen.container.querySelector(".mc-retention-curve-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("week 1: 71% retained.");
  });

  it("onActive reports the focused datum (period + value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<RetentionCurve data={SAMPLE} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-retention-curve-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toEqual({ index: 1, value: 0.71 });
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active period: fires onSelect + pins a mark that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(<RetentionCurve data={SAMPLE} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-retention-curve-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toEqual({ index: 1, value: 0.71 });
    wrap.blur();
    await expect.poll(() => wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the mark with no interaction", async () => {
    const screen = await render(<RetentionCurve data={SAMPLE} selectedIndex={2} />);
    const wrap = screen.container.querySelector(".mc-retention-curve-live") as HTMLElement;
    expect(wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
