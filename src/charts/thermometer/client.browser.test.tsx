import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Thermometer } from "./client.js";
import { pointerAway } from "../../test/pointer.js";

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <Thermometer>", () => {
  it("announces the value on change; quiet on mount", async () => {
    const screen = await render(<Thermometer value={40} target={80} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<Thermometer value={85} target={80} />);
    expect(live.textContent).toBe("85 on a 0–100 scale; target 80.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<Thermometer value={72} title="Fundraiser" />);
    const wrap = screen.container.querySelector(".mc-thermo-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Fundraiser. 72 on a 0–100 scale.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("click fires onSelect with the reading", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Thermometer value={72} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-thermo-live") as HTMLElement;
    wrap.click();
    expect(picks).toMatchObject([{ index: 0, value: 72 }]);
  });

  it("Enter fires onSelect from the focused wrapper", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <Thermometer value={40} target={80} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-thermo-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Enter");
    expect(picks).toMatchObject([{ index: 0, value: 40 }]);
  });

  it('label="value" suppresses the chip (numeral already beside the tube)', async () => {
    const screen = await render(<Thermometer value={72} label="value" width={30} height={48} />);
    const wrap = screen.container.querySelector(".mc-thermo-live") as HTMLElement;
    wrap.focus();
    expect(wrap.querySelector(".mc-spark-readout")).toBeNull();
  });

  // A target draws a tick and is spoken in the summary. Before this it was never
  // PAINTED anywhere: a sighted reader saw a line with no number, while a screen
  // reader was told "target 80". The chip is the one surface with room for it.
  it("the chip names the target when one is set", async () => {
    const screen = await render(<Thermometer value={72} target={80} />);
    const wrap = screen.container.querySelector(".mc-thermo-live") as HTMLElement;
    await userEvent.hover(wrap);
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await expect.poll(chip).toBe("72 / 80");
  });

  // `label="value"` prints the value beside the tube, so on its own the chip adds
  // nothing (the case above). With a target it still holds half the reading.
  it('label="value" still shows the chip when a target is set', async () => {
    const screen = await render(<Thermometer value={72} target={80} label="value" />);
    const wrap = screen.container.querySelector(".mc-thermo-live") as HTMLElement;
    await userEvent.hover(wrap);
    await expect
      .poll(() => screen.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("72 / 80");
  });

  // Edge-only `onActive` — shared/interactive.ts; pointerAway() before blur (src/test/pointer.ts).
  it("onActive reports the reading once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const screen = await render(<Thermometer value={72} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-thermo-live") as HTMLElement;
    await userEvent.hover(wrap);
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await expect.poll(chip).toBe("72");
    // the datum carries the chip's own string, so a consumer can render it
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 72, formatted: chip() });
    wrap.focus(); // already active — must not re-announce
    expect(seen.length).toBe(1);
    // pointerAway before blur — see src/test/pointer.ts (hover+blur order flakes edge counts).
    await pointerAway();
    await expect.poll(() => seen.at(-1)).toBeNull();
    wrap.blur(); // already cleared — must not re-announce
    expect(seen.length).toBe(2);
  });
});
