import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Hourglass } from "./client.js";

describe("interactive <Hourglass>", () => {
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

  it("click fires onSelect with the elapsed fraction", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Hourglass value={0.6} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-hourglass-live") as HTMLElement;
    wrap.click();
    await expect.poll(() => picks.at(-1)).toEqual({ index: 0, value: 0.6 });
  });

  it("Enter fires onSelect", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Hourglass value={0.25} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-hourglass-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toEqual({ index: 0, value: 0.25 });
  });
});
