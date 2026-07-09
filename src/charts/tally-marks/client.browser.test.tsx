import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { TallyMarks } from "./client.js";

describe("interactive <TallyMarks> (plan/24 #1)", () => {
  it("announces the new total on change; quiet on mount", async () => {
    const screen = await render(<TallyMarks value={5} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<TallyMarks value={6} />);
    expect(live.textContent).toBe("6 counted.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<TallyMarks value={23} title="Signatures" />);
    const wrap = screen.container.querySelector(".mc-tally-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Signatures. 23 counted.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("growing the count runs a one-shot draw-in without corrupting the marks", async () => {
    const screen = await render(<TallyMarks value={4} />);
    await screen.rerender(<TallyMarks value={7} />);
    const path = screen.container.querySelector<SVGPathElement>('path[data-mc-ink="data"]')!;
    // 7 strokes present after the update (draw-in is transient)
    expect((path.getAttribute("d")!.match(/M/g) ?? []).length).toBe(7);
  });
});
