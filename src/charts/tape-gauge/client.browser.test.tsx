import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
// the stylesheet is load-bearing here: `:where(.mc-root text)` is what makes a
// bare `fontSize` attribute inert, which is the bug the size assertion guards.
import "../../../styles.css";
import { TapeGauge } from "./client.js";
import { pointerAway } from "../../test/pointer.js";

const ZONES = [{ from: 130, to: 150, tone: "warn" as const }];

describe("interactive <TapeGauge>", () => {
  it("announces the full reading in a live region", async () => {
    const screen = await render(
      <TapeGauge value={142} rate={1} zones={ZONES} span={25} title="Airspeed" height={80} />,
    );
    const wrap = screen.container.querySelector(".mc-tape-live") as HTMLElement;
    expect(wrap.getAttribute("aria-label")).toContain("Now 142");
    const live = wrap.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toContain("Now 142, rising");
  });

  it("click fires onSelect with the current reading", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <TapeGauge value={142} rate={1} zones={ZONES} span={25} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-tape-live") as HTMLElement;
    wrap.click();
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 142 });
  });

  it("Enter fires onSelect", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <TapeGauge value={98} rate={0} span={25} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-tape-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 98 });
  });

  // The hero numeral DROPS below the 7-unit font floor (documented
  // degradation), which used to leave a small gauge with no readable value at
  // all. Hover fills exactly that gap — and stays out of the way when the
  // numeral is painted.
  it("hover reveals the reading only when the gauge cannot print it", async () => {
    const small = await render(<TapeGauge value={142} span={25} width={16} height={22} />);
    const sw = small.container.querySelector(".mc-tape-live") as HTMLElement;
    expect(sw.querySelector("text")?.textContent).not.toBe("142");
    await userEvent.hover(sw);
    await expect
      .poll(() => small.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("142");

    const big = await render(<TapeGauge value={142} span={25} height={80} />);
    const bw = big.container.querySelector(".mc-tape-live") as HTMLElement;
    await userEvent.hover(bw);
    expect(bw.querySelector(".mc-spark-readout")).toBeNull();
  });

  it('label="none" hides the numeral, so hover carries the reading', async () => {
    const screen = await render(<TapeGauge value={142} span={25} label="none" height={80} />);
    const wrap = screen.container.querySelector(".mc-tape-live") as HTMLElement;
    await userEvent.hover(wrap);
    await expect
      .poll(() => screen.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("142");
  });

  // The readout is the hero number: it must PAINT bigger than the tick labels.
  // The root pins --mc-label-px to the tick size, so without an inline
  // font-size the SVG attribute is inert and both render at 7.
  it("paints the reading larger than the scale ticks", async () => {
    const screen = await render(<TapeGauge value={142} span={25} height={80} title="Airspeed" />);
    const texts = [...screen.container.querySelectorAll("text")];
    const hero = texts.find((t) => t.textContent === "142")!;
    const tick = texts.find((t) => t !== hero && (t.textContent ?? "").trim() !== "")!;
    const px = (el: Element) => Number.parseFloat(getComputedStyle(el).fontSize);
    expect(px(hero)).toBeGreaterThan(px(tick));
  });

  // Edge-only `onActive` — shared/interactive.ts; pointerAway() before blur (src/test/pointer.ts).
  it("onActive reports the reading once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <TapeGauge value={142} span={25} width={16} height={22} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-tape-live") as HTMLElement;
    await userEvent.hover(wrap);
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await expect.poll(chip).toBe("142");
    // the datum carries the chip's own string, so a consumer can render it
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 142, formatted: chip() });
    wrap.focus(); // already active — must not re-announce
    expect(seen.length).toBe(1);
    // pointerAway before blur — see src/test/pointer.ts (hover+blur order flakes edge counts).
    await pointerAway();
    await expect.poll(() => seen.at(-1)).toBeNull();
    wrap.blur(); // already cleared — must not re-announce
    expect(seen.length).toBe(2);
  });
});
