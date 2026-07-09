import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { PolarClock } from "./client.js";

const WEEK = [120, 200, 180, 210, 260, 90, 60]; // Sun..Sat

describe("interactive <PolarClock> (plan/24 #17)", () => {
  it("arrow keys step segments circularly and announce weekday + value", async () => {
    const screen = await render(<PolarClock data={WEEK} title="Week" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Sunday: 120.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Monday: 200.");
    await userEvent.keyboard("{ArrowLeft}");
    await userEvent.keyboard("{ArrowLeft}");
    expect(live.textContent).toBe("Saturday: 60.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<PolarClock data={WEEK} title="Week" />);
    const wrap = screen.container.querySelector(".mc-polar-live")!;
    expect(wrap.getAttribute("aria-label")).toBe(
      "Week. Peaks at Thursday (260); quietest Saturday.",
    );
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });
});
