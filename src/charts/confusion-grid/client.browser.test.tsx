import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { ConfusionGrid } from "./client.js";

const CATDOG = {
  labels: ["cat", "dog"],
  counts: [
    [88, 12],
    [10, 59],
  ],
};

const mount = async (ui: React.ReactNode) => {
  const screen = await render(ui);
  return screen.getByRole("img").element() as HTMLElement;
};

describe("interactive <ConfusionGrid>", () => {
  it("→ roves cells; announces actual/predicted with row-share phrasing", async () => {
    const fig = await mount(<ConfusionGrid data={CATDOG} title="Classifier" size={80} />);
    fig.focus();
    // first arrow from nothing lands on cell 0 (kernel contract), then walks
    await userEvent.keyboard("{ArrowRight}");
    const live = fig.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Actual cat, predicted cat: 88% of cats.");
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => live.textContent).toBe("Actual cat, predicted dog: 12% of cats.");
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(() => live.textContent).toBe("Actual dog, predicted dog: 86% of dogs.");
    await userEvent.keyboard("{ArrowRight}"); // right edge → consumed, no move
    await expect.poll(() => live.textContent).toBe("Actual dog, predicted dog: 86% of dogs.");
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => live.textContent).toBe("");
  });

  it("onActive reports the focused cell datum (index + row share); null on clear", async () => {
    const seen: unknown[] = [];
    const fig = await mount(
      <ConfusionGrid data={CATDOG} size={80} onActive={(d) => seen.push(d)} />,
    );
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}");
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 0.12, label: "cat→dog" });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active cell: fires onSelect + pins a ring that survives blur", async () => {
    const picks: unknown[] = [];
    const fig = await mount(
      <ConfusionGrid data={CATDOG} size={80} onSelect={(d) => picks.push(d)} />,
    );
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowDown}{Enter}");
    expect(picks.at(-1)).toMatchObject({ index: 2, value: 0.14, label: "dog→cat" });
    fig.blur();
    await expect.poll(() => fig.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the ring with no interaction", async () => {
    const fig = await mount(<ConfusionGrid data={CATDOG} size={80} selectedIndex={3} />);
    expect(fig.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
