import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { DicePips } from "./client.js";

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <DicePips>", () => {
  it("announces the new face on change; quiet on mount", async () => {
    const screen = await render(<DicePips value={2} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<DicePips value={5} />);
    expect(live.textContent).toBe("5 out of 6.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<DicePips value={4} title="Severity" />);
    const wrap = screen.container.querySelector(".mc-dice-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Severity. 4 out of 6.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("click fires onSelect with the face count", async () => {
    const picks: unknown[] = [];
    const screen = await render(<DicePips value={4} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-dice-live") as HTMLElement;
    wrap.click();
    expect(picks).toMatchObject([{ index: 0, value: 4 }]);
  });

  it("Enter fires onSelect from the focused wrapper", async () => {
    const picks: unknown[] = [];
    const screen = await render(<DicePips value={5} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-dice-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Enter");
    expect(picks).toMatchObject([{ index: 0, value: 5 }]);
  });
});
