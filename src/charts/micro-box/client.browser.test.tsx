import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { MicroBox } from "./client.js";

const STATS = { min: 12, q1: 35, median: 42, q3: 51, max: 96 };

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <MicroBox>", () => {
  it("←/→ rove the fixed 5-stop model with stat announcements", async () => {
    const screen = await render(<MicroBox stats={STATS} title="Latency" />);
    const wrap = screen.container.querySelector(".mc-box-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Min: 12.");
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toBe("Q1: 35.");
    key(wrap, "End");
    await expect.poll(() => live.textContent).toBe("Max: 96.");
  });

  it("onActive reports the focused stat; null after Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(<MicroBox stats={STATS} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-box-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 12, label: "min" });
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 35, label: "q1" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active stat: fires onSelect + pins a rule that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(<MicroBox stats={STATS} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-box-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 1, value: 35, label: "q1" });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('line[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the rule without focus", async () => {
    const screen = await render(<MicroBox stats={STATS} selectedIndex={2} />);
    expect(screen.container.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });
});
