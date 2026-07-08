import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { StatusDot } from "./client.js";

describe("interactive <StatusDot> (plan/22 #2)", () => {
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
});
