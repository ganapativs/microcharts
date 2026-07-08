import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { LikertStrip } from "./client.js";

const SURVEY = [
  { label: "Strongly disagree", value: 10 },
  { label: "Disagree", value: 14 },
  { label: "Neutral", value: 14 },
  { label: "Agree", value: 34 },
  { label: "Strongly agree", value: 28 },
];

describe("interactive <LikertStrip> (plan/22 #30)", () => {
  it("←/→ step levels in data order with share announcements", async () => {
    const screen = await render(<LikertStrip data={SURVEY} title="Q1" />);
    const wrap = screen.container.querySelector(".mc-likert-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^Disagree: 14%, level 2 of 5\.$/);
  });

  it("end labels are vertically centered on the bar (central baseline)", async () => {
    // guards the dominant-baseline="central" fix: the +0.35·fontSize cap-box
    // offset put labels ~2.5px high; central centers the box exactly.
    const screen = await render(<LikertStrip data={SURVEY} label="ends" title="Q1" />);
    const svg = screen.container.querySelector("svg")!;
    const labels = [...svg.querySelectorAll("text")].filter((t) => /%/.test(t.textContent ?? ""));
    const rects = [...svg.querySelectorAll("rect")];
    const barMid =
      (Math.min(...rects.map((r) => r.getBoundingClientRect().top)) +
        Math.max(...rects.map((r) => r.getBoundingClientRect().bottom))) /
      2;
    expect(labels.length).toBeGreaterThan(0);
    for (const t of labels) {
      const b = t.getBoundingClientRect();
      expect(Math.abs((b.top + b.bottom) / 2 - barMid)).toBeLessThan(1.2);
    }
  });
});
