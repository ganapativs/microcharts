import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { MusicStaff } from "./client.js";

const MELODY = [3, 5, 4, 8, 6, 9];

describe("interactive <MusicStaff>", () => {
  it("arrow keys step the notes and announce them", async () => {
    const screen = await render(<MusicStaff data={MELODY} title="Melody" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(live.textContent).toBe("Point 1 of 6: 3.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Point 2 of 6: 5.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<MusicStaff data={MELODY} title="Melody" />);
    const wrap = screen.container.querySelector(".mc-staff-live")!;
    expect(wrap.getAttribute("aria-label")).toBe(
      "Melody. Trending up 200%. Range 3 to 9. Last value 9.",
    );
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });
});
