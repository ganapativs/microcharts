import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { SparkBar } from "./client.js";

const D = [3, 5, 4, 7, 6, 9, 8, 11];
const mount = async () => {
  const screen = await render(<SparkBar data={D} title="Weekly" />);
  return screen.getByRole("img").element() as HTMLElement;
};

describe("interactive <SparkBar> (plan/04 §4, plan/08 T2)", () => {
  it("focusable role=img with composed name", async () => {
    const fig = await mount();
    expect(fig.getAttribute("tabindex")).toBe("0");
    expect(fig.getAttribute("aria-label")).toMatch(/Weekly\. Trending up/);
  });

  it("keyboard walks bars and announces value; active bar goes accent", async () => {
    const fig = await mount();
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(live.textContent).toBe("Bar 1: 3");
    expect(fig.querySelectorAll('rect[data-mc-ink="accent"]').length).toBeGreaterThanOrEqual(1);
    await userEvent.keyboard("{End}");
    expect(live.textContent).toBe("Bar 8: 11");
    await userEvent.keyboard("{Escape}");
    expect(live.textContent).toBe("");
  });
});
