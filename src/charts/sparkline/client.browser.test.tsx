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
    // The crosshair is built once and MOVED, so it is hidden rather than
    // removed on blur — a node recreated per scrub step could not transition.
    // What must hold is that it stops being SHOWN, and that the readout goes.
    const cross = (): Element | null => fig.querySelector("g[data-mc-ui] > g");
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(cross()!.getAttribute("opacity")).toBe("1");
    expect(fig.querySelector(".mc-spark-readout")!.textContent).toBe("4");
    fig.blur();
    await expect.poll(() => cross()!.getAttribute("opacity")).toBe("0");
    expect(fig.querySelector(".mc-spark-readout")).toBe(null);
  });

  it("SVG visual layer is aria-hidden (name comes from the wrapper)", async () => {
    const fig = await mount();
    expect(fig.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("onActive reports the focused datum (data index + value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<Sparkline data={D} onActive={(d) => seen.push(d)} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}");
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 6 });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active point: fires onSelect + pins a persistent ring", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Sparkline data={D} onSelect={(d) => picks.push(d)} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}{Enter}");
    expect(picks.at(-1)).toMatchObject({ index: 1, value: 6 });
    // Pin survives blur (it is selection, not hover).
    fig.blur();
    await expect.poll(() => fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the mark with no internal state", async () => {
    const screen = await render(<Sparkline data={D} selectedIndex={3} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("a pin that outlives its series announces nothing, not NaN", async () => {
    // A live series can shrink under a pinned index. The readout used to index
    // straight into `data`, so the announcement read "Point 0 of 3: NaN" and the
    // crosshair pointed at an undefined coordinate.
    const screen = await render(<Sparkline data={D} selectedIndex={8} title="Revenue" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("Point 9 of 10: 13.");

    await screen.rerender(<Sparkline data={[4, 6, 5]} selectedIndex={8} title="Revenue" />);
    await expect.poll(() => live.textContent).toBe("");
  });

  it("a selection pointed at a gap shows nothing, not NaN", async () => {
    const screen = await render(
      <Sparkline data={[4, Number.NaN, 5]} selectedIndex={1} title="Revenue" />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('[aria-live="polite"]')!.textContent).toBe("");
    expect(fig.querySelector(".mc-spark-readout")).toBeNull();
  });
});
