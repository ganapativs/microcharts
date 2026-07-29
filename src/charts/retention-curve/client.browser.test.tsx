import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { RetentionCurve } from "./client.js";
import { retentionGeometry } from "./geometry.js";
import { pointerAway } from "../../test/pointer.js";

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
    await expect.poll(() => seen.at(-1)).toMatchObject({ index: 1, value: 0.71 });
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
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 1, value: 0.71 });
    wrap.blur();
    await expect.poll(() => wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("across a gap, the emitted index and selectedIndex address the same period", async () => {
    // Period 1 is missing, so `points` is one shorter than `data` from there on:
    // an index that meant "position in points" would seat the pin a period early.
    const GAPPY = [1, Number.NaN, 0.5, 0.4];
    const picks: unknown[] = [];
    const screen = await render(
      <RetentionCurve data={GAPPY} unit="week" onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-retention-curve-live") as HTMLElement;
    wrap.focus();
    // Home lands on period 0; one step skips the gap onto period 2.
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("week 2: 50% retained.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 2, value: 0.5 });

    // Round trip: feeding that index back as `selectedIndex` pins period 2.
    const geo = retentionGeometry({ width: 80, height: 20, data: GAPPY, curve: "step" })!;
    const expected = geo.points.find((p) => p.period === 2)!;
    const pinned = await render(<RetentionCurve data={GAPPY} selectedIndex={2} />);
    const pin = pinned.container.querySelector('circle[data-mc-w="tick"]')!;
    expect(pin.getAttribute("cx")).toBe(String(expected.x));
  });

  it("a box too short to seat the readout drops its gutter from the hit map too", async () => {
    // The static drops the last-value readout under a ~7-unit-tall box and
    // hands the reserved gutter back to the plot. Mirroring only `label` here
    // kept paying for that gutter, so the picker mapped the cursor across a
    // viewBox ~20 units wider than the SVG under it: the midpoint of the mark
    // resolved to period 4 instead of 3.
    const screen = await render(<RetentionCurve data={SAMPLE} unit="week" width={80} height={6} />);
    const wrap = screen.container.querySelector(".mc-retention-curve-live") as HTMLElement;
    const r = wrap.querySelector("svg")!.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: r.left + r.width / 2,
        clientY: r.top + r.height / 2,
        bubbles: true,
        pointerType: "mouse",
      }),
    );
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("week 3: 43% retained.");
    await pointerAway();
  });

  it("controlled selectedIndex pins the mark with no interaction", async () => {
    const screen = await render(<RetentionCurve data={SAMPLE} selectedIndex={2} />);
    const wrap = screen.container.querySelector(".mc-retention-curve-live") as HTMLElement;
    expect(wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
