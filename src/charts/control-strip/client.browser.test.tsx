import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ControlStrip } from "./client.js";

const SAMPLE = [10, 11, 9, 10, 11, 9, 10, 10, 11, 9, 10, 16];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <ControlStrip>", () => {
  it("arrow keys step points; out points announce which limit was crossed", async () => {
    const screen = await render(<ControlStrip data={SAMPLE} title="Line 3" />);
    const wrap = screen.container.querySelector(".mc-control-strip-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 1 of 12: 10 — in control.");
    key(wrap, "End");
    await expect
      .poll(() => live.textContent)
      .toBe("Point 12 of 12: 16 — above the upper limit (14.85).");
    // a VISIBLE readout chip shows the value
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBe("16");
  });

  it("rapid arrow presses don't drop", async () => {
    const screen = await render(<ControlStrip data={SAMPLE} title="Line 3" />);
    const wrap = screen.container.querySelector(".mc-control-strip-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "ArrowRight");
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toContain("Point 3 of 12");
  });

  it("onActive reports the focused point (index + value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<ControlStrip data={SAMPLE} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-control-strip-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "ArrowRight");
    await expect.poll(() => seen.at(-1)).toEqual({ index: 1, value: 11 });
    key(wrap, "Escape");
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active point: fires onSelect + pins a persistent mark", async () => {
    const picks: unknown[] = [];
    const screen = await render(<ControlStrip data={SAMPLE} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-control-strip-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "Enter");
    await expect.poll(() => picks.at(-1)).toEqual({ index: 0, value: 10 });
    wrap.blur();
    await expect.poll(() => wrap.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the mark without focus", async () => {
    const screen = await render(<ControlStrip data={SAMPLE} selectedIndex={1} />);
    const wrap = screen.container.querySelector(".mc-control-strip-live") as HTMLElement;
    expect(wrap.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });
});
