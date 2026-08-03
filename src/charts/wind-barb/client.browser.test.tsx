import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { WindBarb } from "./client.js";
import { pointerAway } from "../../test/pointer.js";

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <WindBarb>", () => {
  it("announces the new reading on change; quiet on mount", async () => {
    const screen = await render(<WindBarb direction={225} magnitude={32} step={10} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<WindBarb direction={90} magnitude={18} step={10} />);
    expect(live.textContent).toBe("East (90°), magnitude 18.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<WindBarb direction={225} magnitude={32} title="Wind" />);
    const wrap = screen.container.querySelector(".mc-windbarb-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Wind. Southwest (225°), magnitude 32.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("click fires onSelect with the magnitude and octant label", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <WindBarb direction={225} magnitude={32} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-windbarb-live") as HTMLElement;
    wrap.click();
    expect(picks).toMatchObject([{ index: 0, value: 32, label: "southwest" }]);
  });

  it("negative magnitude reports |magnitude| (direction already flipped)", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <WindBarb direction={45} magnitude={-25} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-windbarb-live") as HTMLElement;
    wrap.click();
    expect(picks).toMatchObject([{ index: 0, value: 25, label: "southwest" }]);
  });

  it("calm reports the calm reading", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <WindBarb direction={0} magnitude={0} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-windbarb-live") as HTMLElement;
    wrap.click();
    expect(picks).toMatchObject([{ index: 0, value: 0, label: "Calm." }]);
  });

  it("Enter fires onSelect from the focused wrapper", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <WindBarb direction={225} magnitude={32} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-windbarb-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Enter");
    expect(picks).toMatchObject([{ index: 0, value: 32 }]);
  });

  it("hover paints the reading chip; blur clears it", async () => {
    const screen = await render(<WindBarb direction={225} magnitude={32} />);
    const wrap = screen.container.querySelector(".mc-windbarb-live") as HTMLElement;
    const chip = (): HTMLElement | null => wrap.querySelector<HTMLElement>(".mc-spark-readout");
    expect(chip()).toBeNull();
    await userEvent.hover(wrap);
    expect(chip()?.textContent).toBe("southwest 225° · 32");
    await pointerAway();
    expect(chip()).toBeNull();
  });

  it('label="value" suppresses the chip (magnitude already printed)', async () => {
    const screen = await render(<WindBarb direction={225} magnitude={32} label="value" />);
    const wrap = screen.container.querySelector(".mc-windbarb-live") as HTMLElement;
    await userEvent.hover(wrap);
    expect(wrap.querySelector(".mc-spark-readout")).toBeNull();
  });

  // Edge-only `onActive` — shared/interactive.ts; pointerAway() before blur (src/test/pointer.ts). This
  // is the only channel a consumer has for a hovered datum with the chip off.
  it("onActive reports the reading once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <WindBarb direction={225} magnitude={32} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-windbarb-live") as HTMLElement;
    await userEvent.hover(wrap);
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 32 });
    wrap.focus(); // already active — must not re-announce
    expect(seen.length).toBe(1);
    // pointerAway before blur — see src/test/pointer.ts (hover+blur order flakes edge counts).
    await pointerAway();
    await expect.poll(() => seen.at(-1)).toBeNull();
    wrap.blur(); // already cleared — must not re-announce
    expect(seen.length).toBe(2);
  });
});
