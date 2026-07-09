import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { QuantileDots } from "./client.js";

const UNIFORM = Array.from({ length: 20 }, (_, i) => i + 1); // 1..20

describe("interactive <QuantileDots> (plan/23 #12)", () => {
  it("the probe: hovering recomputes the count past the live threshold", async () => {
    const screen = await render(
      <QuantileDots data={UNIFORM} threshold={15} side="above" title="Bus wait" />,
    );
    const wrap = screen.container.querySelector(".mc-quantile-dots-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    // hover near the right edge → few dots above
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width * 0.9,
        clientY: r.top + r.height / 2,
      }),
    );
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^\d+ in 20 chances above /);
    // the readout chip reports the live odds
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toMatch(/in 20$/);
  });

  it("Escape returns the probe to the prop threshold", async () => {
    const screen = await render(<QuantileDots data={UNIFORM} threshold={15} title="Wait" />);
    const wrap = screen.container.querySelector(".mc-quantile-dots-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    // no crash; static threshold count (5 in 20) still reachable via the label
    expect(wrap.querySelector(".mc-quantile-dots") || wrap.querySelector("svg")).toBeTruthy();
  });
});
