import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Waveform } from "./client.js";

const SPIKE = Array.from({ length: 60 }, (_, i) => (i === 30 ? 0.9 : Math.sin(i / 2) * 0.2));
// 8 samples at width 120 → 8 buckets, where the two pitches diverge visibly:
// envelope vertices step 118/7 (last at x = 119), bar centres step 118/8
// (last at x ≈ 111.6).
const EIGHT = [0.2, -0.5, 0.8, -0.3, 0.6, -0.7, 0.4, -0.9];

describe("interactive <Waveform>", () => {
  it("←/→ rove buckets; each announces its position + peak", async () => {
    const screen = await render(<Waveform data={SPIKE} title="Wave" width={120} height={24} />);
    const wrap = screen.container.querySelector(".mc-wave-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/through, peak/);
    expect(screen.container.querySelector(".mc-spark-readout")).not.toBeNull();
  });

  it("onActive reports the focused bucket datum (bucket index + magnitude); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <Waveform data={SPIKE} width={120} height={24} onActive={(d) => seen.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 0 });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active bucket: fires onSelect + pins a persistent mark", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <Waveform data={SPIKE} width={120} height={24} onSelect={(d) => picks.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{Enter}");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 0 });
    // Pin survives blur (it is selection, not hover).
    fig.blur();
    await expect.poll(() => fig.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });

  it('mode="envelope" tracks the envelope pitch, and pins nothing', async () => {
    const screen = await render(<Waveform data={EIGHT} mode="envelope" width={120} height={24} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{End}");
    // The crosshair is carried on a transform so it can glide to the position it
    // names, so its painted x is `x1` plus that translation — reading `x1` alone
    // would report 0 for every pitch and assert nothing.
    await expect
      .poll(() => {
        const l = fig.querySelector<SVGLineElement>('line[data-mc-w="support"]');
        if (!l) return undefined;
        const dx = /translateX\(([-\d.]+)px\)/.exec(l.style.transform);
        return Number(l.getAttribute("x1")) + (dx ? Number(dx[1]) : 0);
      })
      .toBe(119);
    // No bars are painted in envelope mode, so there is no rect to outline.
    await userEvent.keyboard("{Enter}");
    fig.blur();
    await expect.poll(() => fig.querySelector('rect[data-mc-w="tick"]')).toBeNull();
  });

  it("controlled selectedIndex pins the mark with no interaction", async () => {
    const screen = await render(
      <Waveform data={SPIKE} width={120} height={24} selectedIndex={30} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
