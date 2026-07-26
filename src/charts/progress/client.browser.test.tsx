import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Progress } from "./client.js";
import { pointerAway } from "../../test/pointer.js";

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <Progress>", () => {
  it("announces whole-percent changes; stays quiet on sub-percent noise", async () => {
    const screen = await render(<Progress value={0.5} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe(""); // quiet on mount
    await screen.rerender(<Progress value={0.503} />); // same whole percent
    expect(live.textContent).toBe("");
    await screen.rerender(<Progress value={0.51} />);
    expect(live.textContent).toBe("51% complete.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<Progress value={0.68} title="Upload" />);
    const wrap = screen.container.querySelector(".mc-progress-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Upload. 68% complete.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("click fires onSelect with the fraction", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Progress value={0.68} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-progress-live") as HTMLElement;
    wrap.click();
    expect(picks).toMatchObject([{ index: 0, value: 0.68 }]);
  });

  it("Enter fires onSelect from the focused wrapper", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Progress value={3} max={4} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-progress-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Enter");
    expect(picks).toMatchObject([{ index: 0, value: 0.75 }]);
  });

  it('label="none" bars reveal their percent on hover; labelled ones don\'t', async () => {
    const screen = await render(<Progress value={0.62} label="none" />);
    const wrap = screen.container.querySelector(".mc-progress-live") as HTMLElement;
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await userEvent.hover(wrap);
    await expect.poll(chip).toBe("62%");
    await pointerAway();
    await expect.poll(chip).toBeUndefined();

    const labelled = await render(<Progress value={0.62} />);
    const lw = labelled.container.querySelector(".mc-progress-live") as HTMLElement;
    await userEvent.hover(lw);
    expect(lw.querySelector(".mc-spark-readout")).toBeNull();
  });

  // The shared interaction contract (shared/interactive.ts): `onActive` reports
  // the hovered/focused unit and `null` when that clears — on the EDGE only, so
  // hover-then-focus is one announcement, not two.
  it("onActive reports the bar once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <Progress value={0.62} label="none" onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-progress-live") as HTMLElement;
    await userEvent.hover(wrap);
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await expect.poll(chip).toBe("62%");
    // the datum carries the chip's own string, so a consumer can render it
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 0.62, formatted: chip() });
    wrap.focus(); // already active — must not re-announce
    expect(seen.length).toBe(1);
    // Leave the mark BEFORE dropping focus. Blurring while the pointer is
    // still over it leaves a hovered-but-unfocused state, and the move away
    // then re-enters — two extra edges, order-dependent, the CI-only
    // `expected 4 to be 2` this file has flaked with twice.
    await pointerAway();
    await expect.poll(() => seen.at(-1)).toBeNull();
    wrap.blur(); // already cleared — must not re-announce
    expect(seen.length).toBe(2);
  });
});
