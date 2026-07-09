import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { TreeRings } from "./client.js";

const YEARS = [8, 12, 10, 18, 22, 15, 20, 14];

describe("interactive <TreeRings> (plan/24 #13)", () => {
  it("arrow keys step rings inner→outer and announce the period", async () => {
    const screen = await render(<TreeRings data={YEARS} periodWord="year" title="Age" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Year 1: 8.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Year 2: 12.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(
      <TreeRings data={YEARS} unit="years" periodWord="year" title="Age" />,
    );
    const wrap = screen.container.querySelector(".mc-tree-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Age. 8 years; latest 14, biggest 22 in year 5.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });
});
