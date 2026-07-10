import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "@vitest/browser/context";
import { StationGlyph } from "./client.js";

const OBS = {
  cloud: 0.75,
  wind: { direction: 225, magnitude: 15 },
  temp: 16,
  dewpoint: 9,
  pressure: 1013,
  station: "KSFO",
} as const;

describe("interactive <StationGlyph> (plan/25 §20)", () => {
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
});
