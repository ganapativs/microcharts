import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Honeycomb } from "./client.js";

describe("interactive <Honeycomb> (plan/24 #15)", () => {
  it("announces the new count on change; quiet on mount", async () => {
    const screen = await render(<Honeycomb value={30} total={40} unit="seats" />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<Honeycomb value={34} total={40} unit="seats" />);
    expect(live.textContent).toBe("34 of 40 seats filled.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<Honeycomb value={34} total={40} unit="seats" title="Occupancy" />);
    const wrap = screen.container.querySelector(".mc-honeycomb-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Occupancy. 34 of 40 seats filled.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });
});
