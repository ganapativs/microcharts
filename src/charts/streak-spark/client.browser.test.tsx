import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { StreakSpark } from "./client.js";

// runs: ok2 (record), fail1, ok1 (current)
const D = [true, true, false, true];
const mount = async () => {
  const screen = await render(<StreakSpark data={D} title="Deploys" />);
  return screen.getByRole("img").element() as HTMLElement;
};

describe("interactive <StreakSpark>", () => {
  it("focusable role=img with composed name", async () => {
    const fig = await mount();
    expect(fig.getAttribute("tabindex")).toBe("0");
    expect(fig.getAttribute("aria-label")).toMatch(/Deploys\. Current run 1 passing/);
  });

  it("keyboard roves runs and announces the run; the record run says so", async () => {
    const fig = await mount();
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(live.textContent).toBe("Run 1 of 3: 2 passing, record.");
    // active run gets an accent focus outline
    expect(fig.querySelectorAll('rect[stroke="var(--mc-accent)"]').length).toBe(1);
    await userEvent.keyboard("{End}");
    expect(live.textContent).toBe("Run 3 of 3: 1 passing.");
    await userEvent.keyboard("{Escape}");
    expect(live.textContent).toBe("");
  });

  it("a break run announces the failing outcome", async () => {
    const fig = await mount();
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{Home}");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Run 2 of 3: 1 failing.");
  });

  it("onActive reports the focused run datum (run index + length); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<StreakSpark data={D} onActive={(d) => seen.push(d)} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}");
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 1, label: "failing" });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active run: fires onSelect + pins a persistent outline", async () => {
    const picks: unknown[] = [];
    const screen = await render(<StreakSpark data={D} onSelect={(d) => picks.push(d)} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{Enter}");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 2, label: "passing" });
    // Pin survives blur (it is selection, not hover).
    fig.blur();
    await expect.poll(() => fig.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the outline with no interaction", async () => {
    const screen = await render(<StreakSpark data={D} selectedIndex={2} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
