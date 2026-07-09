import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Hourglass } from "./client.js";

describe("interactive <Hourglass> (plan/24 #7)", () => {
  it("announces only when a documented threshold is crossed", async () => {
    const screen = await render(<Hourglass value={0.3} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    // 0.3 → 0.4: no threshold crossed → still quiet
    await screen.rerender(<Hourglass value={0.4} />);
    expect(live.textContent).toBe("");
    // 0.4 → 0.6: crosses 50% → announce
    await screen.rerender(<Hourglass value={0.6} />);
    await vi.waitFor(() => expect(live.textContent).toBe("60% elapsed, 40% remaining."));
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<Hourglass value={0.75} title="Session" />);
    const wrap = screen.container.querySelector(".mc-hourglass-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Session. 75% elapsed, 25% remaining.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });
});
