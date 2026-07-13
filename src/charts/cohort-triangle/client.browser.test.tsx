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
  });

  it("focusing a cell rings it (accent outline)", async () => {
    const fig = await mount(<CohortTriangle data={COHORTS} title="Cohorts" />);
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(fig.querySelector('rect[stroke="var(--mc-accent)"]')).not.toBeNull();
  });
});
