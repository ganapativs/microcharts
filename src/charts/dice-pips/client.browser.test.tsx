import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { DicePips } from "./client.js";
import { pointerAway } from "../../test/pointer.js";

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <DicePips>", () => {
  it("announces the new face on change; quiet on mount", async () => {
    const screen = await render(<DicePips value={2} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<DicePips value={5} />);
    expect(live.textContent).toBe("5 out of 6.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<DicePips value={4} title="Severity" />);
    const wrap = screen.container.querySelector(".mc-dice-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Severity. 4 out of 6.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("click fires onSelect with the face count", async () => {
    const picks: unknown[] = [];
    const screen = await render(<DicePips value={4} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-dice-live") as HTMLElement;
    wrap.click();
    expect(picks).toMatchObject([{ index: 0, value: 4 }]);
  });

  it("Enter fires onSelect from the focused wrapper", async () => {
    const picks: unknown[] = [];
    const screen = await render(<DicePips value={5} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-dice-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Enter");
    expect(picks).toMatchObject([{ index: 0, value: 5 }]);
  });

  // The shared interaction contract (shared/interactive.ts): `onActive` reports
  // the hovered/focused unit and `null` when that clears — on the EDGE only, so
  // hover-then-focus is one announcement, not two. The face paints no chip, so
  // this is the only channel a consumer has for a hover reading.
  it("onActive reports the face once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const screen = await render(<DicePips value={4} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-dice-live") as HTMLElement;
    await userEvent.hover(wrap);
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 4 });
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
