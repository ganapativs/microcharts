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

describe("interactive <GradeProfile> (plan/26 §3)", () => {
  it("→ roves segments; announces the true grade + cumulative climb", async () => {
    const screen = await render(
      <GradeProfile data={TRAIL} format={(n) => `${n} m`} title="Route" width={200} height={40} />,
    );
    const wrap = screen.container.querySelector(".mc-grade-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    // segment 2 (index 1): 100→250, grade 2%, cumulative climb 9 + 3 = 12 m
    await expect.poll(() => live.textContent).toBe("250 m: 2%, 12 m gained.");
  });
});
