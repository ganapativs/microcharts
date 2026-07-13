import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { RubricStrip } from "./client.js";

const RUBRIC = [
  { label: "Correctness", score: 0.92, weight: 3 },
  { label: "Coverage", score: 0.78, weight: 2 },
  { label: "Style", score: 0.41, weight: 1 },
];

describe("interactive <RubricStrip>", () => {
  it("↓ roves criteria; announces score + weight share", async () => {
    const screen = await render(<RubricStrip data={RUBRIC} title="Eval" width={120} height={30} />);
    const wrap = screen.container.querySelector(".mc-rubric-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Coverage: 0.78, weight 33% of total.");
  });
});
