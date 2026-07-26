import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { MoonPhase } from "./client.js";

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <MoonPhase>", () => {
  it("announces the phase on change (leading edge); quiet on mount", async () => {
    const screen = await render(<MoonPhase value={0.3} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<MoonPhase value={0.7} />);
    await vi.waitFor(() => expect(live.textContent).toBe("70% of the cycle complete."));
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<MoonPhase value={0.68} title="Sprint" />);
    const wrap = screen.container.querySelector(".mc-moon-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Sprint. 68% of the cycle complete.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("click fires onSelect with the clamped fraction", async () => {
    const picks: unknown[] = [];
    const screen = await render(<MoonPhase value={0.68} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-moon-live") as HTMLElement;
    wrap.click();
    expect(picks).toMatchObject([{ index: 0, value: 0.68 }]);
  });

  it("Enter fires onSelect from the focused wrapper", async () => {
    const picks: unknown[] = [];
    const screen = await render(<MoonPhase value={1.4} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-moon-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Enter");
    expect(picks).toMatchObject([{ index: 0, value: 1 }]); // clamped, like the lit area
  });

  // The shared interaction contract (shared/interactive.ts): `onActive` reports
  // the hovered/focused unit and `null` when that clears — on the EDGE only, so
  // hover-then-focus is one announcement, not two.
  it("onActive reports the disc once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const screen = await render(<MoonPhase value={0.68} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-moon-live") as HTMLElement;
    await userEvent.hover(wrap);
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await expect.poll(chip).toBe("68%");
    // the datum carries the chip's own string, so a consumer can render it
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 0.68, formatted: chip() });
    wrap.focus(); // already active — must not re-announce
    expect(seen.length).toBe(1);
    wrap.blur();
    await userEvent.unhover(wrap); // already cleared — must not re-announce
    await expect.poll(() => seen.at(-1)).toBeNull();
    expect(seen.length).toBe(2);
  });
});
