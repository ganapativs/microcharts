import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { TallyMarks } from "./client.js";

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <TallyMarks>", () => {
  it("announces the new total on change; quiet on mount", async () => {
    const screen = await render(<TallyMarks value={5} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<TallyMarks value={6} />);
    expect(live.textContent).toBe("6 counted.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<TallyMarks value={23} title="Signatures" />);
    const wrap = screen.container.querySelector(".mc-tally-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Signatures. 23 counted.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("growing the count runs a one-shot draw-in without corrupting the marks", async () => {
    const screen = await render(<TallyMarks value={4} />);
    await screen.rerender(<TallyMarks value={7} />);
    const path = screen.container.querySelector<SVGPathElement>('path[data-mc-ink="data"]')!;
    // 7 strokes present after the update (draw-in is transient)
    expect((path.getAttribute("d")!.match(/M/g) ?? []).length).toBe(7);
  });

  it("click fires onSelect with the count", async () => {
    const picks: unknown[] = [];
    const screen = await render(<TallyMarks value={23} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-tally-live") as HTMLElement;
    wrap.click();
    expect(picks).toMatchObject([{ index: 0, value: 23 }]);
  });

  it("Enter fires onSelect from the focused wrapper", async () => {
    const picks: unknown[] = [];
    const screen = await render(<TallyMarks value={7} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-tally-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Enter");
    expect(picks).toMatchObject([{ index: 0, value: 7 }]);
  });

  // The shared interaction contract (shared/interactive.ts): `onActive` reports
  // the hovered/focused unit and `null` when that clears — on the EDGE only, so
  // hover-then-focus is one announcement, not two. The tally paints no chip, so
  // this is the only channel a consumer has for a hover reading.
  it("onActive reports the count once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const screen = await render(<TallyMarks value={23} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-tally-live") as HTMLElement;
    await userEvent.hover(wrap);
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 23 });
    wrap.focus(); // already active — must not re-announce
    expect(seen.length).toBe(1);
    wrap.blur();
    await userEvent.unhover(wrap); // already cleared — must not re-announce
    await expect.poll(() => seen.at(-1)).toBeNull();
    expect(seen.length).toBe(2);
  });
});
