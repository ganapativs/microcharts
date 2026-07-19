import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { RubricStrip } from "./client.js";

const RUBRIC = [
  { label: "Correctness", score: 0.92, weight: 3 },
  { label: "Coverage", score: 0.78, weight: 2 },
  { label: "Style", score: 0.41, weight: 1 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <RubricStrip>", () => {
  it("↓ roves criteria; announces score + weight share", async () => {
    const screen = await render(<RubricStrip data={RUBRIC} title="Eval" width={120} height={30} />);
    const wrap = screen.container.querySelector(".mc-rubric-live") as HTMLElement;
    wrap.focus();
    // First arrow lands on criterion 0 (kernel contract), not criterion 1.
    key(wrap, "ArrowDown");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Correctness: 0.92, weight 50% of total.");
    key(wrap, "ArrowDown");
    await expect.poll(() => live.textContent).toBe("Coverage: 0.78, weight 33% of total.");
  });

  it("onActive reports the focused criterion; null on Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <RubricStrip data={RUBRIC} width={120} height={30} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-rubric-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    expect(seen[seen.length - 1]).toEqual({ index: 0, value: 0.92, label: "Correctness" });
    key(wrap, "End");
    expect(seen[seen.length - 1]).toEqual({ index: 2, value: 0.41, label: "Style" });
    key(wrap, "Escape");
    expect(seen[seen.length - 1]).toBeNull();
  });

  it("Enter selects the active criterion: fires onSelect + pins a box that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <RubricStrip data={RUBRIC} width={120} height={30} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-rubric-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    key(wrap, "Enter");
    expect(picks[picks.length - 1]).toEqual({ index: 0, value: 0.92, label: "Correctness" });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the box without focus", async () => {
    const screen = await render(
      <RubricStrip data={RUBRIC} width={120} height={30} selectedIndex={1} />,
    );
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
