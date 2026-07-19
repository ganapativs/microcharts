import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Progress } from "./client.js";

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <Progress>", () => {
  it("announces whole-percent changes; stays quiet on sub-percent noise", async () => {
    const screen = await render(<Progress value={0.5} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe(""); // quiet on mount
    await screen.rerender(<Progress value={0.503} />); // same whole percent
    expect(live.textContent).toBe("");
    await screen.rerender(<Progress value={0.51} />);
    expect(live.textContent).toBe("51% complete.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<Progress value={0.68} title="Upload" />);
    const wrap = screen.container.querySelector(".mc-progress-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Upload. 68% complete.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("click fires onSelect with the fraction", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Progress value={0.68} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-progress-live") as HTMLElement;
    wrap.click();
    expect(picks).toEqual([{ index: 0, value: 0.68 }]);
  });

  it("Enter fires onSelect from the focused wrapper", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Progress value={3} max={4} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-progress-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Enter");
    expect(picks).toEqual([{ index: 0, value: 0.75 }]);
  });
});
