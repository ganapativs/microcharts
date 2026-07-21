import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { GradedBand } from "./client.js";

const SAMPLE = Array.from({ length: 101 }, (_, i) => i);

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <GradedBand>", () => {
  it("arrow keys step levels outward, announcing each interval", async () => {
    const screen = await render(<GradedBand data={SAMPLE} title="Estimate" />);
    const wrap = screen.container.querySelector(".mc-graded-band-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("50% interval: 25 to 75.");
    key(wrap, "End");
    await expect.poll(() => live.textContent).toBe("95% interval: 2.5 to 97.5.");
    // a VISIBLE readout chip shows the band's level + bounds
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("95% 2.5–97.5");
    // both edge ticks present for the active band
    expect(wrap.querySelectorAll("svg line").length).toBeGreaterThanOrEqual(3);
  });

  it("hover snaps to the nearest band edge", async () => {
    const screen = await render(<GradedBand data={SAMPLE} />);
    const wrap = screen.container.querySelector(".mc-graded-band-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width / 2,
        clientY: r.top + r.height / 2,
      }),
    );
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toContain("interval");
  });

  it("onActive reports the focused band (index + level p); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<GradedBand data={SAMPLE} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-graded-band-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "ArrowRight");
    await expect.poll(() => seen.at(-1)).toMatchObject({ index: 1, value: 80 });
    key(wrap, "Escape");
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active band: fires onSelect + pins persistent edges", async () => {
    const picks: unknown[] = [];
    const screen = await render(<GradedBand data={SAMPLE} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-graded-band-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "Enter");
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 50 });
    wrap.blur();
    await expect.poll(() => wrap.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the edges without focus", async () => {
    const screen = await render(<GradedBand data={SAMPLE} selectedIndex={2} />);
    const wrap = screen.container.querySelector(".mc-graded-band-live") as HTMLElement;
    expect(wrap.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });
});
