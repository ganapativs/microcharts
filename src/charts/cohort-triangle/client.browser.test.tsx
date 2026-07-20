import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { CohortTriangle } from "./client.js";
import type { CohortRow } from "./geometry.js";

const COHORTS: CohortRow[] = [
  { label: "Jan", values: [1, 0.6, 0.45, 0.4, 0.38] },
  { label: "Feb", values: [1, 0.5, 0.4, 0.35] },
  { label: "Mar", values: [1, 0.44, 0.34] },
  { label: "Apr", values: [1, 0.52] },
];

const mount = async (ui: React.ReactNode) => {
  const screen = await render(ui);
  return screen.getByRole("img").element() as HTMLElement;
};

describe("interactive <CohortTriangle>", () => {
  it("focusable role=img with the equal-maturity name", async () => {
    const fig = await mount(<CohortTriangle data={COHORTS} title="Cohorts" />);
    expect(fig.getAttribute("tabindex")).toBe("0");
    expect(fig.getAttribute("aria-label")).toMatch(/Cohorts\. 4 cohorts; at period 1, Mar retains/);
  });

  it("keyboard: Home selects the first cell; arrows walk in 2-D; announces", async () => {
    const fig = await mount(<CohortTriangle data={COHORTS} title="Cohorts" />);
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(live.textContent).toBe("Jan cohort, period 0: 100%.");
    await userEvent.keyboard("{ArrowDown}"); // next cohort, same age
    expect(live.textContent).toBe("Feb cohort, period 0: 100%.");
    await userEvent.keyboard("{ArrowRight}"); // next age, same cohort
    expect(live.textContent).toBe("Feb cohort, period 1: 50%.");
    await userEvent.keyboard("{Escape}");
    expect(live.textContent).toBe("");
  });

  it("arrows stay put at a ragged edge (no cell there)", async () => {
    const fig = await mount(<CohortTriangle data={COHORTS} title="Cohorts" />);
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{End}"); // last cell = Apr, age 1
    expect(live.textContent).toBe("Apr cohort, period 1: 52%.");
    await userEvent.keyboard("{ArrowRight}"); // Apr has no age 2 → unchanged
    expect(live.textContent).toBe("Apr cohort, period 1: 52%.");
    await userEvent.keyboard("{ArrowDown}"); // no cohort below Apr → unchanged
    expect(live.textContent).toBe("Apr cohort, period 1: 52%.");
  });

  it("↓ into a shorter cohort clamps to that row's last observed age", async () => {
    const fig = await mount(<CohortTriangle data={COHORTS} title="Cohorts" />);
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(live.textContent).toBe("Jan cohort, period 4: 38%."); // Jan's deepest age
    await userEvent.keyboard("{ArrowDown}"); // Feb stops at age 3 → clamp
    expect(live.textContent).toBe("Feb cohort, period 3: 35%.");
    await userEvent.keyboard("{ArrowDown}"); // Mar stops at age 2 → clamp
    expect(live.textContent).toBe("Mar cohort, period 2: 34%.");
    await userEvent.keyboard("{ArrowUp}"); // back up, column held at 2
    expect(live.textContent).toBe("Feb cohort, period 2: 40%.");
  });

  it("focusing a cell rings it (accent outline)", async () => {
    const fig = await mount(<CohortTriangle data={COHORTS} title="Cohorts" />);
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(fig.querySelector('rect[stroke="var(--mc-accent)"]')).not.toBeNull();
  });

  it("onActive reports the focused cell datum (index + retention + cohort); null on clear", async () => {
    const seen: unknown[] = [];
    const fig = await mount(<CohortTriangle data={COHORTS} onActive={(d) => seen.push(d)} />);
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}");
    expect(seen.at(-1)).toEqual({ index: 1, value: 0.6, label: "Jan" });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active cell: fires onSelect + pins a ring that survives blur", async () => {
    const picks: unknown[] = [];
    const fig = await mount(<CohortTriangle data={COHORTS} onSelect={(d) => picks.push(d)} />);
    fig.focus();
    await userEvent.keyboard("{End}{Enter}");
    expect(picks.at(-1)).toEqual({ index: 13, value: 0.52, label: "Apr" });
    fig.blur();
    await expect.poll(() => fig.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the ring with no interaction", async () => {
    const fig = await mount(<CohortTriangle data={COHORTS} selectedIndex={2} />);
    expect(fig.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });

  // Regression: the picker used to hit-test the WRAPPER's box. `.mc-inline`
  // seats a mark by `translate`ing `.mc-root` — a visual move that leaves the
  // layout box behind — so an inline-seated chart resolved the pointer to a
  // cell rows away from the one under the cursor.
  it("hovers resolve against the PAINTED box when the seat translates the SVG", async () => {
    const fig = await mount(<CohortTriangle data={COHORTS} cell={12} gap={2} />);
    const live = fig.querySelector('[aria-live="polite"]')!;
    const svg = fig.querySelector("svg")!;
    svg.style.translate = "0 28px"; // what `.mc-inline .mc-root` does

    // cells are emitted row-major over the ragged triangle: Jan's 5, then Feb's.
    const cells = svg.querySelectorAll('rect[data-mc-ink="cell"], rect[data-mc-ink="gap"]');
    await userEvent.hover(cells[6] as Element); // Feb, age 1
    expect(live.textContent).toBe("Feb cohort, period 1: 50%.");
  });
});
