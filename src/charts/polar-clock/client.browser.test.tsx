import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { PolarClock } from "./client.js";

const WEEK = [120, 200, 180, 210, 260, 90, 60]; // Sun..Sat

describe("interactive <PolarClock>", () => {
  it("arrow keys step segments circularly and announce weekday + value", async () => {
    const screen = await render(<PolarClock data={WEEK} title="Week" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => live.textContent).toBe("Sunday: 120.");
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => live.textContent).toBe("Monday: 200.");
    await userEvent.keyboard("{ArrowLeft}");
    await expect.poll(() => live.textContent).toBe("Sunday: 120.");
    await userEvent.keyboard("{ArrowLeft}");
    await expect.poll(() => live.textContent).toBe("Saturday: 60.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<PolarClock data={WEEK} title="Week" />);
    const wrap = screen.container.querySelector(".mc-polar-live")!;
    expect(wrap.getAttribute("aria-label")).toBe(
      "Week. Peaks at Thursday (260); quietest Saturday.",
    );
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("onActive reports the focused datum (data index + value + label); null on Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(<PolarClock data={WEEK} onActive={(d) => seen.push(d)} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 120, label: "Sunday" });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active segment: fires onSelect + pins a sector that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(<PolarClock data={WEEK} onSelect={(d) => picks.push(d)} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}{Enter}");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 120, label: "Sunday" });
    fig.blur();
    await expect.poll(() => fig.querySelector('path[data-mc-w="tick"]')).not.toBeNull();
  });

  it("a fractional `origin` still answers the pointer (client shares the paint's rotation)", async () => {
    // origin=1.5 rotates by whole slots, so Monday sits at 12 o'clock. Inverting
    // the RAW origin here produced index 1.5 — no segment, a dial dead to hover.
    const seen: unknown[] = [];
    const screen = await render(
      <PolarClock data={WEEK} origin={1.5} onActive={(d) => seen.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    const r = fig.getBoundingClientRect();
    fig.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width / 2,
        clientY: r.top + 2, // just below 12 o'clock
      }),
    );
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 200, label: "Monday" });
    const live = fig.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Monday: 200.");
  });

  // The static drops a `label="max"` numeral it cannot fit and drops the band
  // with it. The client maps the pointer over that same box, so it has to ask
  // the static rather than re-derive `fontSize * 1.35`: a phantom 15-unit gutter
  // stretches every pointer y and the dial answers with the wrong segment.
  it("shares the label band with the static, including when the numeral is dropped", async () => {
    const WIDE = [10, 20, 30, 40, 50, 60, 70, 1234567]; // 9 digits: no room at size 24
    const seen: unknown[] = [];
    const screen = await render(
      <PolarClock data={WIDE} size={24} label="max" onActive={(d) => seen.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 24 24");
    const r = fig.getBoundingClientRect();
    // Just right of the hub on the horizontal centreline — 3 o'clock. A phantom
    // gutter pushes this point's y below the hub and swings it to 5 o'clock.
    fig.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width * 0.6,
        clientY: r.top + r.height / 2,
      }),
    );
    expect(seen.at(-1)).toMatchObject({ index: 2, value: 30 });
  });

  it("controlled selectedIndex pins the sector without focus", async () => {
    const screen = await render(<PolarClock data={WEEK} selectedIndex={3} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('path[data-mc-w="tick"]')).not.toBeNull();
  });

  // ↑/↓ must MOVE (and be consumed). Unhandled, they scrolled the page while a
  // keyboard reader was roving the dial — every other radial chart aliases them.
  it("↑/↓ rove the cycle like ←/→, and are consumed", async () => {
    const screen = await render(<PolarClock data={WEEK} title="Week" />);
    const wrap = screen.getByRole("img").element() as HTMLElement;
    const live = wrap.querySelector('[aria-live="polite"]')!;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    // let the Home announcement land before capturing it — React state is async
    await expect.poll(() => live.textContent).not.toBe("");
    const first = live.textContent;
    const down = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    wrap.dispatchEvent(down);
    expect(down.defaultPrevented, "ArrowDown must be consumed, not left to scroll").toBe(true);
    await expect.poll(() => live.textContent).not.toBe(first);
    const up = new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true });
    wrap.dispatchEvent(up);
    expect(up.defaultPrevented).toBe(true);
    await expect.poll(() => live.textContent).toBe(first);
  });
});
