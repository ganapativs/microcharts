import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { PhaseTrace } from "./client.js";

const TRAJ = [
  { x: 30, y: 80 },
  { x: 42, y: 95 },
  { x: 55, y: 115 },
  { x: 62, y: 130 },
];

describe("interactive <PhaseTrace> (plan/25 §17)", () => {
  it("←/→ step time; announce the point by its index + named axes", async () => {
    const screen = await render(
      <PhaseTrace
        data={TRAJ}
        xLabel="CPU"
        yLabel="Latency"
        title="Phase"
        width={120}
        height={100}
      />,
    );
    const wrap = screen.container.querySelector(".mc-phase-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("point 3 of 4: CPU 55, Latency 115.");
  });
});
