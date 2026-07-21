import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { CoverageStrip } from "./client.js";

const DATA = [3, 9, null, 18];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <CoverageStrip>", () => {
  it("arrow keys rove slots; the live region distinguishes measured from missing", async () => {
    const screen = await render(<CoverageStrip data={DATA} title="Uptime" />);
    const wrap = screen.container.querySelector(".mc-coverage-strip-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Slot 1: 3.");
    // a VISIBLE readout chip shows the measured value
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBe("3");
    key(wrap, "ArrowRight");
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toBe("Slot 3: no measurement.");
    // the chip shows a locale-neutral dash for a gap (no hardcoded English);
    // the live region above carries the localized "no measurement" sentence
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBe("—");
    // focus ring overlay present (4 cells + ring)
    expect(wrap.querySelectorAll("svg rect").length).toBe(5);
  });

  it("hover finds the slot by grid lookup", async () => {
    const screen = await render(<CoverageStrip data={DATA} />);
    const wrap = screen.container.querySelector(".mc-coverage-strip-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width - 2,
        clientY: r.top + r.height / 2,
      }),
    );
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Slot 4: 18.");
  });

  it("onActive reports the focused slot (index + value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<CoverageStrip data={DATA} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-coverage-strip-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 3 });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active slot: fires onSelect + pins a ring that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(<CoverageStrip data={DATA} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-coverage-strip-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 3 });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<CoverageStrip data={DATA} selectedIndex={2} />);
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
