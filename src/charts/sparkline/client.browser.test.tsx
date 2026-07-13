import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Sparkline } from "./client.js";

const D = [4, 6, 5, 9, 7, 8, 11, 9, 13, 12];
const mount = async () => {
  const screen = await render(<Sparkline data={D} title="Revenue" />);
  return screen.getByRole("img").element() as HTMLElement;
};

describe("interactive <Sparkline>", () => {
  it("renders a focusable role=img with the composed accessible name", async () => {
    const fig = await mount();
    expect(fig.getAttribute("tabindex")).toBe("0");
    expect(fig.getAttribute("aria-label")).toMatch(/Revenue\. Trending up/);
  });

  it("keyboard: ArrowRight walks points and announces the focused value", async () => {
    const fig = await mount();
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(live.textContent).toBe("Point 1 of 10: 4.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Point 2 of 10: 6.");
    await userEvent.keyboard("{End}");
    expect(live.textContent).toBe("Point 10 of 10: 12.");
    await userEvent.keyboard("{Escape}");
    expect(live.textContent).toBe("");
  });

  it("focusing shows an active crosshair + readout; blur clears them", async () => {
    const fig = await mount();
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(fig.querySelector('line[data-mc-ink="muted"]')).not.toBeNull();
    expect(fig.querySelector(".mc-spark-readout")!.textContent).toBe("4");
    fig.blur();
    await expect.poll(() => fig.querySelector('line[data-mc-ink="muted"]')).toBe(null);
  });

  it("SVG visual layer is aria-hidden (name comes from the wrapper)", async () => {
    const fig = await mount();
    expect(fig.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });
});
