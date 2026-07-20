import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { StatusDot } from "./client.js";

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <StatusDot>", () => {
  it("focusable wrapper owns the naming; quiet on mount", async () => {
    const screen = await render(<StatusDot status="ok" title="Deploys" />);
    const wrap = screen.container.querySelector(".mc-status-live")!;
    expect(wrap.getAttribute("role")).toBe("img");
    expect(wrap.getAttribute("aria-label")).toBe("Deploys. Status: ok.");
    expect(wrap.querySelector('[aria-live="polite"]')!.textContent).toBe("");
  });

  it("announces state changes with the title context", async () => {
    const screen = await render(<StatusDot status="ok" title="Deploys" />);
    await screen.rerender(<StatusDot status="warn" title="Deploys" />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("Deploys. Status: warning.");
  });

  it("live={false} → no live region", async () => {
    await render(<StatusDot status="ok" live={false} />);
    expect(document.querySelector('[aria-live="polite"]')).toBeNull();
  });

  it("click fires onSelect with the state name (a status encodes no number)", async () => {
    const picks: unknown[] = [];
    const screen = await render(<StatusDot status="warn" onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-status-live") as HTMLElement;
    wrap.click();
    expect(picks).toEqual([{ index: 0, value: null, label: "warning" }]);
  });

  it("Enter fires onSelect from the focused wrapper", async () => {
    const picks: unknown[] = [];
    const screen = await render(<StatusDot status="ok" onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-status-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Enter");
    expect(picks).toEqual([{ index: 0, value: null, label: "ok" }]);
  });
});
