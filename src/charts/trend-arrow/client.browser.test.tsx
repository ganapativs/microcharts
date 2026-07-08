import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { TrendArrow } from "./client.js";

describe("interactive <TrendArrow> (plan/22 #1)", () => {
  it("focusable wrapper owns the naming; static chart is decorative", async () => {
    const screen = await render(<TrendArrow value={0.12} title="Growth" />);
    const wrap = screen.container.querySelector(".mc-trend-live")!;
    expect(wrap.getAttribute("role")).toBe("img");
    expect(wrap.getAttribute("tabindex")).toBe("0");
    expect(wrap.getAttribute("aria-label")).toContain("Growth");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("announces + pulses on direction change only", async () => {
    const screen = await render(<TrendArrow value={0.1} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    await screen.rerender(<TrendArrow value={0.2} />); // same direction — no pulse
    expect(document.querySelector('.mc-trend-live[data-pulse="1"]')).toBeNull();
    await screen.rerender(<TrendArrow value={-0.05} />); // direction flip
    expect(live.textContent).toContain("Down");
    expect(document.querySelector('.mc-trend-live[data-pulse="1"]')).not.toBeNull();
  });

  it("live={false} → no live region", async () => {
    await render(<TrendArrow value={0.1} live={false} />);
    expect(document.querySelector('[aria-live="polite"]')).toBeNull();
  });
});
