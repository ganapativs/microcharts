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
});
