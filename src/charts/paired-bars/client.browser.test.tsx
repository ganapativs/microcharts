import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { PairedBars } from "./client.js";

const DATA = [
  { label: "East", value: 940, ref: 1200 },
  { label: "West", value: 410, ref: 400 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <PairedBars>", () => {
  it("arrow keys rove pairs with vs announcements", async () => {
    const screen = await render(<PairedBars data={DATA} title="Budget" />);
    const wrap = screen.container.querySelector(".mc-paired-live") as HTMLElement;
    wrap.focus();
    // First arrow focuses pair 0 (no skip-to-1).
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("East: 940 vs 1,200.");
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toBe("West: 410 vs 400.");
    key(wrap, "Home");
    await expect.poll(() => live.textContent).toBe("East: 940 vs 1,200.");
  });

  it("onActive reports the focused datum (pair index + value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<PairedBars data={DATA} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-paired-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    await expect.poll(() => seen.at(-1)).toMatchObject({ index: 0, value: 940, label: "East" });
    key(wrap, "Escape");
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active pair: fires onSelect + pins a persistent outline", async () => {
    const picks: unknown[] = [];
    const screen = await render(<PairedBars data={DATA} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-paired-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 940, label: "East" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect.poll(() => wrap.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });

  // Regression: the chip's `left` was `shownPos + bandW / 2`, and `pitch` is a
  // length on the CATEGORY axis — which is y when horizontal. Roving rows slid
  // the chip sideways across a chart whose rows all share one x.
  it("horizontal orientation keeps the readout over the chart, not drifting by row", async () => {
    const four = [
      { label: "A", value: 10, ref: 12 },
      { label: "B", value: 20, ref: 18 },
      { label: "C", value: 30, ref: 33 },
      { label: "D", value: 40, ref: 36 },
    ];
    const screen = await render(<PairedBars data={four} orientation="horizontal" />);
    const wrap = screen.container.querySelector(".mc-paired-live") as HTMLElement;
    wrap.focus();
    const centreAfter = async (k: string) => {
      key(wrap, k);
      await expect.poll(() => wrap.querySelector(".mc-spark-readout")).not.toBeNull();
      return (wrap.querySelector(".mc-spark-readout") as HTMLElement).style.left;
    };
    // No row may set an inline `left`: the chip is placed by the stylesheet, so
    // it cannot drift by row and cannot escape the screen (see
    // shared/interactive.ts). This file renders without the stylesheet.
    const centres = [
      await centreAfter("Home"),
      await centreAfter("ArrowDown"),
      await centreAfter("ArrowDown"),
      await centreAfter("ArrowDown"),
    ];
    expect(new Set(centres)).toEqual(new Set([""]));
  });

  // Was "vertical orientation still tracks the chip to the pair's band". It no
  // longer does, deliberately: a per-datum offset is an inline `left`, and an
  // inline `left` is what stopped the chip being clamped to the screen. Both
  // orientations now park it over the chart; the band is named in the readout
  // text and marked by the focus ring.
  it("vertical orientation parks the chip over the chart, band to band", async () => {
    const screen = await render(<PairedBars data={DATA} />);
    const wrap = screen.container.querySelector(".mc-paired-live") as HTMLElement;
    wrap.focus();
    const centre = () => (wrap.querySelector(".mc-spark-readout") as HTMLElement).style.left;
    key(wrap, "Home");
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")).not.toBeNull();
    const first = centre();
    key(wrap, "ArrowRight");
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")).not.toBeNull();
    expect(centre()).toBe(first);
  });

  it("controlled selectedIndex pins the outline without focus", async () => {
    const screen = await render(<PairedBars data={DATA} selectedIndex={1} />);
    const wrap = screen.container.querySelector(".mc-paired-live") as HTMLElement;
    expect(wrap.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });

  it("a pair with no value reads out as an em dash", async () => {
    const screen = await render(
      <PairedBars
        data={[
          { label: "East", value: 940, ref: 1200 },
          { label: "West", value: null, ref: 800 },
        ]}
      />,
    );
    const wrap = screen.container.querySelector(".mc-paired-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBe("West: —");
  });
});
