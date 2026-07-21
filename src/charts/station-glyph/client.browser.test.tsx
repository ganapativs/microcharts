import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { StationGlyph } from "./client.js";

const OBS = {
  cloud: 0.75,
  wind: { direction: 225, magnitude: 15 },
  temp: 16,
  dewpoint: 9,
  pressure: 1013,
  station: "KSFO",
} as const;

/** The pinned field box — the only `w="full"` mark (the glyph draws none). */
const PIN = 'rect[data-mc-w="tick"]';

describe("interactive <StationGlyph>", () => {
  it("roves fields with ←/→ into a live region", async () => {
    const screen = await render(<StationGlyph {...OBS} title="Observation" size={40} />);
    const wrap = screen.container.querySelector(".mc-station-live") as HTMLElement;
    expect(wrap.getAttribute("aria-label")).toContain("KSFO, wind southwest 15");
    wrap.focus();
    await userEvent.keyboard("{ArrowRight}");
    const live = wrap.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("KSFO");
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => live.textContent).toContain("wind southwest");
  });

  it("onActive reports the focused field (unit index + its encoded number)", async () => {
    const onActive = vi.fn();
    const screen = await render(<StationGlyph {...OBS} size={40} onActive={onActive} />);
    const wrap = screen.container.querySelector(".mc-station-live") as HTMLElement;
    wrap.focus();
    // fields in order: station, wind, sky, temp, dew, pressure
    await userEvent.keyboard("{ArrowRight}");
    expect(onActive).toHaveBeenLastCalledWith(
      expect.objectContaining({ index: 0, value: null, label: "KSFO" }),
    );
    await userEvent.keyboard("{ArrowRight}");
    expect(onActive).toHaveBeenLastCalledWith(
      expect.objectContaining({ index: 1, value: 15, label: "wind southwest 15" }),
    );
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(onActive).toHaveBeenLastCalledWith(
      expect.objectContaining({ index: 3, value: 16, label: "temp 16°" }),
    );
    await userEvent.keyboard("{Escape}");
    expect(onActive).toHaveBeenLastCalledWith(null);
  });

  it("Enter selects the active field, fires onSelect and pins a box that survives blur", async () => {
    const onSelect = vi.fn();
    const screen = await render(<StationGlyph {...OBS} size={40} onSelect={onSelect} />);
    const wrap = screen.container.querySelector(".mc-station-live") as HTMLElement;
    wrap.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ index: 2, value: 0.75, label: "sky broken" }),
    );
    wrap.blur();
    await expect.poll(() => wrap.querySelectorAll(PIN).length).toBe(1);
  });

  it("controlled selectedIndex pins a field with no interaction", async () => {
    const screen = await render(<StationGlyph {...OBS} size={40} selectedIndex={5} />);
    const wrap = screen.container.querySelector(".mc-station-live") as HTMLElement;
    expect(wrap.querySelectorAll(PIN).length).toBe(1);
  });

  it("forwards consumer children into the composed static glyph", async () => {
    const screen = await render(
      <StationGlyph {...OBS} size={40}>
        <circle cx={1} cy={1} r={1} data-testid="annotation" />
      </StationGlyph>,
    );
    expect(screen.container.querySelector('[data-testid="annotation"]')).not.toBeNull();
  });
});
