import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { EventTimeline } from "./client.js";

const H = 3_600_000;
const T0 = Date.UTC(2026, 5, 3, 0, 0); // 2026-06-03 00:00 UTC
const DATA = [
  { start: T0 + 9 * H, end: T0 + 13.5 * H, label: "Deploy freeze", kind: "accent" as const },
  { start: T0 + 11 * H + 12 * 60_000, label: "Incident", kind: "negative" as const },
];
const WINDOW: [number, number] = [T0, T0 + 24 * H];

const mount = async (ui: React.ReactNode) => {
  const screen = await render(ui);
  return screen.getByRole("img").element() as HTMLElement;
};

describe("interactive <EventTimeline> (plan/22 #27)", () => {
  it("focusable role=img named by the coverage summary", async () => {
    const fig = await mount(<EventTimeline data={DATA} domain={WINDOW} title="api" />);
    expect(fig.getAttribute("aria-label")).toBe("api. 1 span covering 19% of the window; 1 event.");
  });

  it("keyboard cycles items chronologically with span/event announcements", async () => {
    const fig = await mount(<EventTimeline data={DATA} domain={WINDOW} />);
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(live.textContent).toBe("Deploy freeze: Jun 3, 09:00 to Jun 3, 13:30 — 4h 30m.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Incident: Jun 3, 11:12.");
    await userEvent.keyboard("{Escape}");
    expect(live.textContent).toBe("");
  });

  it("focus outlines the active item", async () => {
    const fig = await mount(<EventTimeline data={DATA} domain={WINDOW} />);
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(fig.querySelector('rect[stroke="var(--mc-accent)"]')).not.toBeNull();
  });
});
