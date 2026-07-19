import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { MusicStaff } from "./client.js";

const MELODY = [3, 5, 4, 8, 6, 9];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

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

  it("onActive reports the focused note (index in data space); null on Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(<MusicStaff data={MELODY} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-staff-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen[seen.length - 1]).toEqual({ index: 0, value: 3 });
    key(wrap, "End");
    expect(seen[seen.length - 1]).toEqual({ index: 5, value: 9 });
    key(wrap, "Escape");
    expect(seen[seen.length - 1]).toBeNull();
  });

  it("Enter selects the active note: fires onSelect + pins a ring that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(<MusicStaff data={MELODY} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-staff-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks[picks.length - 1]).toEqual({ index: 0, value: 3 });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('circle[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<MusicStaff data={MELODY} selectedIndex={2} />);
    expect(screen.container.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
