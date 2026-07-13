import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Waveform } from "./client.js";

const SPIKE = Array.from({ length: 60 }, (_, i) => (i === 30 ? 0.9 : Math.sin(i / 2) * 0.2));

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
});
