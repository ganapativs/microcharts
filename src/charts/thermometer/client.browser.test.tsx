import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Thermometer } from "./client.js";

describe("interactive <Thermometer>", () => {
  it("announces the value on change; quiet on mount", async () => {
    const screen = await render(<Thermometer value={40} target={80} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<Thermometer value={85} target={80} />);
    expect(live.textContent).toBe("85 on a 0–100 scale; target 80.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<Thermometer value={72} title="Fundraiser" />);
    const wrap = screen.container.querySelector(".mc-thermo-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Fundraiser. 72 on a 0–100 scale.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });
});
