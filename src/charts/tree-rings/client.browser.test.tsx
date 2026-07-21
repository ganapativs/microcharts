import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { TreeRings } from "./client.js";

const YEARS = [8, 12, 10, 18, 22, 15, 20, 14];

describe("interactive <TreeRings>", () => {
  it("arrow keys step rings inner→outer and announce the period", async () => {
    const screen = await render(<TreeRings data={YEARS} periodWord="year" title="Age" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Year 1: 8.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Year 2: 12.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(
      <TreeRings data={YEARS} unit="years" periodWord="year" title="Age" />,
    );
    const wrap = screen.container.querySelector(".mc-tree-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Age. 8 years; latest 14, biggest 22 in year 5.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("onActive reports the focused datum (ring index + value + label); null on Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <TreeRings data={YEARS} periodWord="year" onActive={(d) => seen.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 8, label: "Year 1" });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active ring: fires onSelect + pins a halo that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <TreeRings data={YEARS} periodWord="year" onSelect={(d) => picks.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}{Enter}");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 8, label: "Year 1" });
    fig.blur();
    await expect.poll(() => fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the halo without focus", async () => {
    const screen = await render(<TreeRings data={YEARS} selectedIndex={3} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
