import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { FatDigits } from "./client.js";
import { pointerAway } from "../../test/pointer.js";

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <FatDigits>", () => {
  it("announces the value + tier on change; quiet on mount", async () => {
    const screen = await render(<FatDigits value={200} domain={[0, 1000]} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<FatDigits value={900} domain={[0, 1000]} />);
    expect(live.textContent).toBe("900 — tier 5 of 5.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<FatDigits value={1204} domain={[0, 1500]} title="Revenue" />);
    const wrap = screen.container.querySelector(".mc-fat-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Revenue. 1,204 — tier 4 of 5.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("click fires onSelect with the numeral", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <FatDigits value={1204} domain={[0, 1500]} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-fat-live") as HTMLElement;
    wrap.click();
    expect(picks).toMatchObject([{ index: 0, value: 1204 }]);
  });

  it("Enter fires onSelect from the focused wrapper", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <FatDigits value={200} domain={[0, 1000]} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-fat-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Enter");
    expect(picks).toMatchObject([{ index: 0, value: 200 }]);
  });

  // Edge-only `onActive` — shared/interactive.ts; pointerAway() before blur (src/test/pointer.ts).
  it("onActive reports the numeral once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <FatDigits value={1204} domain={[0, 1500]} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-fat-live") as HTMLElement;
    await userEvent.hover(wrap);
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 1204 });
    wrap.focus(); // already active — must not re-announce
    expect(seen.length).toBe(1);
    // pointerAway before blur — see src/test/pointer.ts (hover+blur order flakes edge counts).
    await pointerAway();
    await expect.poll(() => seen.at(-1)).toBeNull();
    wrap.blur(); // already cleared — must not re-announce
    expect(seen.length).toBe(2);
  });
});
