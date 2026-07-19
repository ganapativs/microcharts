import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { CometTrail } from "./client.js";

const RISING = [40, 45, 50, 55, 60, 65, 70, 72, 75, 78, 80, 84, 87];

describe("interactive <CometTrail>", () => {
  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<CometTrail data={RISING} title="Price" />);
    const wrap = screen.container.querySelector(".mc-comet-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Price. Now 87, rising over the last 12 updates.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("eases the head to a new value on data change", async () => {
    const screen = await render(<CometTrail data={RISING} title="Price" />);
    const head = screen.container.querySelector(".mc-comet-head") as SVGCircleElement;
    await screen.rerender(<CometTrail data={[...RISING, 60]} title="Price" />);
    await vi.waitFor(() => expect(head.getAnimations().length).toBeGreaterThan(0));
  });

  it("arrows walk the trail left (older) to right (now)", async () => {
    const screen = await render(<CometTrail data={RISING} title="Price" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    // The first arrow lands on unit 0 — the oldest point in the window.
    await userEvent.keyboard("{ArrowLeft}");
    expect(live.textContent).toBe("12 updates ago: 40.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("11 updates ago: 45.");
    await userEvent.keyboard("{End}");
    expect(live.textContent).toBe("Now 87.");
  });

  it("onActive reports the focused point; null once cleared", async () => {
    const seen: unknown[] = [];
    const screen = await render(<CometTrail data={RISING} onActive={(d) => seen.push(d)} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(seen.at(-1)).toEqual({ index: 0, value: 40 });
    await userEvent.keyboard("{End}");
    expect(seen.at(-1)).toEqual({ index: 12, value: 87 });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active point: fires onSelect + pins a ring", async () => {
    const picks: unknown[] = [];
    const screen = await render(<CometTrail data={RISING} onSelect={(d) => picks.push(d)} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{Enter}");
    expect(picks.at(-1)).toEqual({ index: 0, value: 40 });
    // Pin survives blur (it is selection, not hover).
    fig.blur();
    await expect.poll(() => fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<CometTrail data={RISING} selectedIndex={4} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
