import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { CyclePlot } from "./client.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKS: number[] = [];
for (let w = 0; w < 6; w++) WEEKS.push(38, 40 + w * 2, 45, 48, 52, 61, 44);

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

const mount = (extra?: Record<string, unknown>) =>
  render(
    <CyclePlot
      data={WEEKS}
      period={7}
      slots={DAYS}
      cycleUnit="weeks"
      width={168}
      height={40}
      title="Weekly shape"
      {...extra}
    />,
  );

describe("interactive <CyclePlot>", () => {
  it("←/→ step slots, announcing the center + drift; a readout chip shows the value", async () => {
    const screen = await mount();
    const wrap = screen.container.querySelector(".mc-cycle-plot-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Sun: mean 38 across 6 weeks, steady.");
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("Sun: 38 (steady)");
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toMatch(/^Mon: mean \d+ across 6 weeks, rising\.$/);
  });

  it("onActive reports the focused slot (index + center + name); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await mount({ onActive: (d: unknown) => seen.push(d) });
    const wrap = screen.container.querySelector(".mc-cycle-plot-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    await expect.poll(() => seen.at(-1)).toMatchObject({ index: 0, value: 38, label: "Sun" });
    key(wrap, "ArrowRight");
    await expect.poll(() => seen.at(-1)).toMatchObject({ index: 1, value: 45, label: "Mon" });
    key(wrap, "Escape");
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active slot: fires onSelect + pins a persistent band", async () => {
    const picks: unknown[] = [];
    const screen = await mount({ onSelect: (d: unknown) => picks.push(d) });
    const wrap = screen.container.querySelector(".mc-cycle-plot-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "Enter");
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 38, label: "Sun" });
    wrap.blur();
    await expect.poll(() => wrap.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });

  it("↑/↓ drill into the observations WITHIN the active slot", async () => {
    const screen = await mount();
    const wrap = screen.container.querySelector(".mc-cycle-plot-live") as HTMLElement;
    wrap.focus();
    const live = document.querySelector('[aria-live="polite"]')!;
    key(wrap, "Home"); // slot 0 = Sun, six observations of 38
    await expect.poll(() => live.textContent).toBe("Sun: mean 38 across 6 weeks, steady.");
    key(wrap, "ArrowDown"); // drill to cycle 1
    await expect.poll(() => live.textContent).toBe("Sun, cycle 1 of 6: 38.");
    key(wrap, "ArrowDown"); // cycle 2
    await expect.poll(() => live.textContent).toBe("Sun, cycle 2 of 6: 38.");
    key(wrap, "ArrowUp"); // back to cycle 1
    await expect.poll(() => live.textContent).toBe("Sun, cycle 1 of 6: 38.");
    key(wrap, "ArrowUp"); // back out to the whole slot
    await expect.poll(() => live.textContent).toBe("Sun: mean 38 across 6 weeks, steady.");
  });

  it("the drill reads the slot's real per-cycle values, and the chip follows", async () => {
    const screen = await mount();
    const wrap = screen.container.querySelector(".mc-cycle-plot-live") as HTMLElement;
    wrap.focus();
    const live = document.querySelector('[aria-live="polite"]')!;
    // Mon is the drifting slot: 40, 42, 44, 46, 48, 50 across the six weeks.
    key(wrap, "Home");
    key(wrap, "ArrowRight"); // slot 1 = Mon
    key(wrap, "ArrowDown"); // cycle 1
    await expect.poll(() => live.textContent).toBe("Mon, cycle 1 of 6: 40.");
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      // "cycle N of M" is prose in a chip; the fraction says it in 3 characters
      // and the live region above still reads the full sentence.
      .toBe("Mon 1/6: 40");
    key(wrap, "ArrowDown");
    key(wrap, "ArrowDown"); // cycle 3
    await expect.poll(() => live.textContent).toBe("Mon, cycle 3 of 6: 44.");
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("Mon 3/6: 44");
  });

  it("↓ stops at the last cycle instead of falling out of the slot", async () => {
    const screen = await mount();
    const wrap = screen.container.querySelector(".mc-cycle-plot-live") as HTMLElement;
    wrap.focus();
    const live = document.querySelector('[aria-live="polite"]')!;
    key(wrap, "Home");
    for (let i = 0; i < 9; i++) key(wrap, "ArrowDown"); // more presses than cycles
    await expect.poll(() => live.textContent).toBe("Sun, cycle 6 of 6: 38.");
  });

  it("changing slot resets the drill, and returning does not resurrect it", async () => {
    const screen = await mount();
    const wrap = screen.container.querySelector(".mc-cycle-plot-live") as HTMLElement;
    wrap.focus();
    const live = document.querySelector('[aria-live="polite"]')!;
    key(wrap, "Home");
    key(wrap, "ArrowDown");
    key(wrap, "ArrowDown"); // Sun, drilled to cycle 2
    await expect.poll(() => live.textContent).toBe("Sun, cycle 2 of 6: 38.");
    key(wrap, "ArrowRight"); // → Mon, back at slot level
    await expect.poll(() => live.textContent).toMatch(/^Mon: mean \d+ across 6 weeks, rising\.$/);
    key(wrap, "ArrowLeft"); // back to Sun — still slot level, not cycle 2
    await expect.poll(() => live.textContent).toBe("Sun: mean 38 across 6 weeks, steady.");
  });

  it("the drill never leaks into the onActive/onSelect contract (slots only)", async () => {
    const seen: unknown[] = [];
    const screen = await mount({ onActive: (d: unknown) => seen.push(d) });
    const wrap = screen.container.querySelector(".mc-cycle-plot-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    await expect.poll(() => seen.at(-1)).toMatchObject({ index: 0, value: 38, label: "Sun" });
    const before = seen.length;
    key(wrap, "ArrowDown");
    key(wrap, "ArrowDown");
    // Drilling changes the readout, not the active unit — no further onActive.
    expect(seen.length).toBe(before);
  });

  it("controlled selectedIndex pins the band without focus", async () => {
    const screen = await mount({ selectedIndex: 1 });
    const wrap = screen.container.querySelector(".mc-cycle-plot-live") as HTMLElement;
    expect(wrap.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });

  it("an empty slot announces no data instead of formatting its NaN center", async () => {
    // Wed (index 3) has no finite observation in any week → an empty slot whose
    // geometry center.value is NaN. Selecting it must not leak "NaN".
    const gappy: number[] = [];
    for (let w = 0; w < 6; w++) gappy.push(38, 40, 45, Number.NaN, 52, 61, 44);
    const screen = await mount({ data: gappy, selectedIndex: 3 });
    const wrap = screen.container.querySelector(".mc-cycle-plot-live") as HTMLElement;
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Wed: no data.");
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBe("Wed: —");
  });
});
