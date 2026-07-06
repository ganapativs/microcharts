import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { ActivityGrid } from "./client.js";

// 14 columns × 7 rows, ascending so levels are easy to reason about.
const DATA = Array.from({ length: 98 }, (_, i) => i);

const mount = async (ui: React.ReactNode) => {
  const screen = await render(ui);
  return screen.getByRole("img").element() as HTMLElement;
};

describe("interactive <ActivityGrid> (plan/04 §4, plan/08 T2)", () => {
  it("focusable role=img with the total/peak name", async () => {
    const fig = await mount(<ActivityGrid data={DATA} title="Commits" />);
    expect(fig.getAttribute("tabindex")).toBe("0");
    expect(fig.getAttribute("aria-label")).toMatch(/Commits\. Total .* Busiest 97\./);
  });

  it("keyboard: Home selects the first cell; arrows walk in 2-D; announces", async () => {
    const fig = await mount(<ActivityGrid data={DATA} title="Commits" />);
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(live.textContent).toBe("Point 1 of 98: 0.");
    await userEvent.keyboard("{ArrowDown}"); // next row, same (first) column → index 1
    expect(live.textContent).toBe("Point 2 of 98: 1.");
    await userEvent.keyboard("{ArrowRight}"); // next column, same row → index 1+7 = 8
    expect(live.textContent).toBe("Point 9 of 98: 8.");
    await userEvent.keyboard("{Escape}");
    expect(live.textContent).toBe("");
  });

  it("focusing a cell rings it (accent outline)", async () => {
    const fig = await mount(<ActivityGrid data={DATA} title="Commits" />);
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(fig.querySelector('rect[stroke="var(--mc-accent)"]')).not.toBeNull();
  });
});
