import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { GradeProfile } from "./client.js";

const TRAIL = [
  { d: 0, elev: 800 },
  { d: 100, elev: 809 },
  { d: 250, elev: 812 },
  { d: 500, elev: 835 },
  { d: 900, elev: 865 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <GradeProfile>", () => {
  it("→ roves segments; announces the true grade + cumulative climb", async () => {
    const screen = await render(
      <GradeProfile data={TRAIL} format={(n) => `${n} m`} title="Route" width={200} height={40} />,
    );
    const wrap = screen.container.querySelector(".mc-grade-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    // first arrow lands on segment 1 (index 0): 0→100, grade 9%, cumulative climb 9 m
    await expect.poll(() => live.textContent).toBe("100 m: 9%, 9 m gained.");
    key(wrap, "ArrowRight");
    // segment 2 (index 1): 100→250, grade 2%, cumulative climb 9 + 3 = 12 m
    await expect.poll(() => live.textContent).toBe("250 m: 2%, 12 m gained.");
  });

  it("onActive reports the focused segment; null on Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <GradeProfile data={TRAIL} width={200} height={40} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-grade-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toEqual({ index: 0, value: 9 });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active segment: fires onSelect + pins the chord", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <GradeProfile data={TRAIL} width={200} height={40} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-grade-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 0, value: 9 });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('line[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the chord without focus", async () => {
    const screen = await render(
      <GradeProfile data={TRAIL} width={200} height={40} selectedIndex={2} />,
    );
    expect(screen.container.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });
});
