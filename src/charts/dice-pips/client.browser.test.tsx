import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { DicePips } from "./client.js";

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
});
