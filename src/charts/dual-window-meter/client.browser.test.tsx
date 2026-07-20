import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { DualWindowMeter } from "./client.js";

const NOISE = Array.from({ length: 40 }, (_, i) => 74 + Math.sin(i / 4) * 3);
// Small, exact series for datum assertions: slow (window 3) mean is finite from
// index 2 → slow[2] = (10+20+30)/3 = 20.
const D = [10, 20, 30, 40, 50];

describe("interactive <DualWindowMeter>", () => {
  it("←/→ rove points; announces fast, slow, target", async () => {
    const screen = await render(
      <DualWindowMeter data={NOISE} target={75} title="Loudness" width={160} height={24} />,
    );
    const wrap = screen.container.querySelector(".mc-dualwin-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/fast .+, slow .+, target 75\./);
  });

  it("onActive reports the focused datum (data index + slow value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <DualWindowMeter data={D} target={30} windows={[2, 3]} onActive={(d) => seen.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}{ArrowRight}");
    expect(seen.at(-1)).toEqual({ index: 2, value: 20 });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active sample: fires onSelect + pins a persistent tick", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <DualWindowMeter data={D} target={30} windows={[2, 3]} onSelect={(d) => picks.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}{ArrowRight}{Enter}");
    expect(picks.at(-1)).toEqual({ index: 2, value: 20 });
    // Pin survives blur (it is selection, not hover).
    fig.blur();
    await expect.poll(() => fig.querySelector('line[data-mc-w="support"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the mark with no interaction", async () => {
    const screen = await render(
      <DualWindowMeter data={D} target={30} windows={[2, 3]} selectedIndex={3} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('line[data-mc-w="support"]')).not.toBeNull();
  });
});
