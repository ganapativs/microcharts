import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { HeatStrip } from "./client.js";

const DATA = [3, 9, null, 18];

const mount = async (ui: React.ReactNode) => {
  const screen = await render(ui);
  return screen.getByRole("img").element() as HTMLElement;
};

describe("interactive <HeatStrip>", () => {
  it("arrow keys rove cells with ActivityGrid-parity announcements + ring", async () => {
    const fig = await mount(<HeatStrip data={DATA} title="Load" />);
    fig.focus();
    const live = fig.querySelector('[aria-live="polite"]')!;
    // first arrow from nothing lands on cell 0 (kernel contract)
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => live.textContent).toBe("Point 1 of 4: 3.");
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => live.textContent).toBe("Point 2 of 4: 9.");
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => live.textContent).toBe("Point 3 of 4: no data.");
    // ring overlay present
    expect(fig.querySelectorAll("svg rect").length).toBe(5); // 4 cells + ring
  });

  it("hover finds the cell by band lookup", async () => {
    const fig = await mount(<HeatStrip data={DATA} />);
    const r = fig.getBoundingClientRect();
    fig.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width - 2,
        clientY: r.top + r.height / 2,
      }),
    );
    await expect.poll(() => document.querySelector(".mc-spark-readout")?.textContent).toBe("18");
  });

  it("onActive reports the focused datum (cell index + value); null on clear", async () => {
    const seen: unknown[] = [];
    const fig = await mount(<HeatStrip data={DATA} onActive={(d) => seen.push(d)} />);
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}");
    expect(seen.at(-1)).toEqual({ index: 1, value: 9 });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active cell: fires onSelect + pins a ring that survives blur", async () => {
    const picks: unknown[] = [];
    const fig = await mount(<HeatStrip data={DATA} onSelect={(d) => picks.push(d)} />);
    fig.focus();
    await userEvent.keyboard("{End}{Enter}");
    expect(picks.at(-1)).toEqual({ index: 3, value: 18 });
    fig.blur();
    await expect.poll(() => fig.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the ring with no interaction", async () => {
    const fig = await mount(<HeatStrip data={DATA} selectedIndex={1} />);
    expect(fig.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
