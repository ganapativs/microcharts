import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { CalibrationStrip } from "./client.js";

const BINS = [
  { predicted: 0.2, observed: 0.18, count: 100 },
  { predicted: 0.5, observed: 0.55, count: 80 },
  { predicted: 0.8, observed: 0.62, count: 40 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <CalibrationStrip>", () => {
  it("←/→ rove bins; announces predicted, observed, support", async () => {
    const screen = await render(
      <CalibrationStrip data={BINS} minSupport={10} title="Calib" width={160} height={32} />,
    );
    const wrap = screen.container.querySelector(".mc-calib-live") as HTMLElement;
    wrap.focus();
    // the first arrow lands on bin 0 (shared interaction contract)
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("predicted 0.2, observed 0.18, 100 samples.");
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toBe("predicted 0.5, observed 0.55, 80 samples.");
  });

  it("onActive reports the focused bin (observed as value); null after Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <CalibrationStrip data={BINS} minSupport={10} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-calib-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toEqual({ index: 0, value: 0.18, label: "0.2" });
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toEqual({ index: 1, value: 0.55, label: "0.5" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active bin: fires onSelect + pins a ring that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <CalibrationStrip data={BINS} minSupport={10} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-calib-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 0, value: 0.18, label: "0.2" });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('circle[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<CalibrationStrip data={BINS} minSupport={10} selectedIndex={2} />);
    expect(screen.container.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
