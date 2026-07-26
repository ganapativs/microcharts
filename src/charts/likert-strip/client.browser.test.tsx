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

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <LikertStrip>", () => {
  it("←/→ step levels in data order, announcing each share AND its count", async () => {
    const screen = await render(<LikertStrip data={SURVEY} title="Q1" />);
    const wrap = screen.container.querySelector(".mc-likert-live") as HTMLElement;
    wrap.focus();
    // First arrow lands on unit 0 (the kernel's shared convention).
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect
      .poll(() => live.textContent)
      .toMatch(/^Strongly disagree: 10% \(10\), level 1 of 5\.$/);
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toMatch(/^Disagree: 14% \(14\), level 2 of 5\.$/);
  });

  it("onActive reports the focused segment; null once cleared", async () => {
    const seen: unknown[] = [];
    const screen = await render(<LikertStrip data={SURVEY} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-likert-live") as HTMLElement;
    wrap.focus();
    key(wrap, "End");
    expect(seen.at(-1)).toMatchObject({ index: 4, value: 28, label: "Strongly agree" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active segment: fires onSelect + pins an outline", async () => {
    const picks: unknown[] = [];
    const screen = await render(<LikertStrip data={SURVEY} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-likert-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 10, label: "Strongly disagree" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the outline without focus", async () => {
    const screen = await render(<LikertStrip data={SURVEY} selectedIndex={3} />);
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
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
