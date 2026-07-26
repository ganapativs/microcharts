import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { TrendArrow } from "./client.js";
import { pointerAway } from "../../test/pointer.js";

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <TrendArrow>", () => {
  it("focusable wrapper owns the naming; static chart is decorative", async () => {
    const screen = await render(<TrendArrow value={0.12} title="Growth" />);
    const wrap = screen.container.querySelector(".mc-trend-live")!;
    expect(wrap.getAttribute("role")).toBe("img");
    expect(wrap.getAttribute("tabindex")).toBe("0");
    expect(wrap.getAttribute("aria-label")).toContain("Growth");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("announces + pulses on direction change only", async () => {
    const screen = await render(<TrendArrow value={0.1} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    await screen.rerender(<TrendArrow value={0.2} />); // same direction — no pulse
    expect(document.querySelector('.mc-trend-live[data-pulse="1"]')).toBeNull();
    await screen.rerender(<TrendArrow value={-0.05} />); // direction flip
    expect(live.textContent).toContain("Down");
    expect(document.querySelector('.mc-trend-live[data-pulse="1"]')).not.toBeNull();
  });

  it("live={false} → the live region stays mounted but says nothing", async () => {
    const screen = await render(<TrendArrow value={0.1} live={false} />);
    // The region is the inline-seat host (shared/live-region.tsx), so it must
    // never be unmounted to silence a chart — silence is empty children.
    const region = screen.container.querySelector('[aria-live="polite"]');
    expect(region).not.toBeNull();
    expect(region!.textContent).toBe("");
  });

  it("click fires onSelect with the signed change + direction", async () => {
    const picks: unknown[] = [];
    const screen = await render(<TrendArrow value={-0.05} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-trend-live") as HTMLElement;
    wrap.click();
    expect(picks).toMatchObject([{ index: 0, value: -0.05, label: "down" }]);
  });

  it("Enter fires onSelect from the focused wrapper", async () => {
    const picks: unknown[] = [];
    const screen = await render(<TrendArrow value={0.12} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-trend-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Enter");
    expect(picks).toMatchObject([{ index: 0, value: 0.12, label: "up" }]);
  });

  // The shared interaction contract (shared/interactive.ts): `onActive` reports
  // the hovered/focused unit and `null` when that clears — on the EDGE only, so
  // hover-then-focus is one announcement, not two. The glyph paints no chip, so
  // this is the only channel a consumer has for a hover reading.
  it("onActive reports the change once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const screen = await render(<TrendArrow value={-0.05} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-trend-live") as HTMLElement;
    await userEvent.hover(wrap);
    expect(seen.at(-1)).toMatchObject({ index: 0, value: -0.05, label: "down" });
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
