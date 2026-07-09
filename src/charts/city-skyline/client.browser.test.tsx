import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { CitySkyline } from "./client.js";

const TEAMS = [
  { label: "Platform", value: 46, lit: 0.7 },
  { label: "Core", value: 32, lit: 0.5 },
  { label: "Web", value: 28 },
];

describe("interactive <CitySkyline> (plan/24 #14)", () => {
  it("arrow keys rove buildings; the lit fraction is announced as a percent", async () => {
    const screen = await render(<CitySkyline data={TEAMS} title="Teams" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Platform: 46; 70% lit.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Core: 32; 50% lit.");
    await userEvent.keyboard("{ArrowRight}"); // Web has no lit
    expect(live.textContent).toBe("Web: 28.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<CitySkyline data={TEAMS} unit="teams" title="Teams" />);
    const wrap = screen.container.querySelector(".mc-skyline-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Teams. 3 teams; tallest Platform at 46.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });
});
