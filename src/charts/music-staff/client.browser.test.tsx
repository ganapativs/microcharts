import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import type { SeriesStrings } from "../../core/summary.js";
import { MusicStaff } from "./client.js";

const MELODY = [3, 5, 4, 8, 6, 9];

/** Every template replaced by a sentinel, so any English left in the output was
 *  written into the component rather than read from `strings`. */
const SENTINEL: SeriesStrings = {
  noData: "«noData»",
  single: () => "«single»",
  flat: () => "«flat»",
  trendPct: () => "«trendPct»",
  trendAbs: () => "«trendAbs»",
  noChange: "«noChange»",
  range: () => "«range»",
  last: () => "«last»",
  point: () => "«point»",
};

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
    expect(seen[seen.length - 1]).toMatchObject({ index: 0, value: 3 });
    key(wrap, "End");
    expect(seen[seen.length - 1]).toMatchObject({ index: 5, value: 9 });
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
    expect(picks[picks.length - 1]).toMatchObject({ index: 0, value: 3 });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('circle[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<MusicStaff data={MELODY} selectedIndex={2} />);
    expect(screen.container.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("`strings` localizes the accessible NAME, not only the announcements", async () => {
    // The wrapper's name came from an unlocalized describeSeries call, so a host
    // that translated the roving readout still shipped an English name.
    const screen = await render(<MusicStaff data={MELODY} strings={SENTINEL} />);
    const wrap = screen.container.querySelector(".mc-staff-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("«trendPct» «range» «last»");
  });

  it("a non-finite box does not desync the overlay from the static chart", async () => {
    // Both entries resolve width/height/fontSize through musicStaffFrame, so a
    // hostile box lands on the documented default in both — the focus ring can't
    // sit where no note was drawn.
    const screen = await render(<MusicStaff data={MELODY} width={NaN} selectedIndex={5} />);
    const svg = screen.container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 60 28");
    const ring = screen.container.querySelector('circle[data-mc-w="tick"]')!;
    const lastNote = [...screen.container.querySelectorAll("ellipse")].at(-1)!;
    expect(ring.getAttribute("cx")).toBe(lastNote.getAttribute("cx"));
  });
});
