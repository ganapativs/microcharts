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
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 40 });
    await userEvent.keyboard("{End}");
    expect(seen.at(-1)).toMatchObject({ index: 12, value: 87 });
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
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 40 });
    // Pin survives blur (it is selection, not hover).
    fig.blur();
    await expect.poll(() => fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<CometTrail data={RISING} selectedIndex={4} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  // The trail's older points had a focus ring and a spoken announcement but no
  // VISIBLE value: a sighted mouse reader got strictly less than a screen
  // reader. The chip closes that gap.
  it("roving paints the point's value as a chip", async () => {
    const screen = await render(<CometTrail data={RISING} title="Price" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}");
    await expect.poll(() => fig.querySelector(".mc-spark-readout")?.textContent).toBe("40");
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => fig.querySelector(".mc-spark-readout")?.textContent).toBe("45");
  });

  it('skips the chip at the head, where `label="last"` already prints it', async () => {
    const screen = await render(<CometTrail data={RISING} title="Price" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{End}");
    // The head is announced but not chipped — the numeral beside it says 87.
    await expect.poll(() => fig.querySelector('[aria-live="polite"]')?.textContent).toBe("Now 87.");
    expect(fig.querySelector(".mc-spark-readout")).toBeNull();
    // …unless the numeral is off, in which case the head chips like any point.
    const bare = await render(<CometTrail data={RISING} label="none" title="Price" />);
    const bareFig = bare.container.querySelector(".mc-comet-live") as HTMLElement;
    bareFig.focus();
    await userEvent.keyboard("{End}");
    await expect.poll(() => bareFig.querySelector(".mc-spark-readout")?.textContent).toBe("87");
  });

  // The gutter reserved for the numeral sets the plot width, so the client has
  // to resolve it off the same shared function as the static frame it composes.
  // Computing it a second way here rings a dot that isn't there.
  it("the focus ring lands on the dot the static frame painted", async () => {
    const screen = await render(<CometTrail data={RISING} title="Price" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{End}");
    const head = fig.querySelector(".mc-comet-head")!;
    await expect
      .poll(() => fig.querySelector('circle[data-mc-w="support"]')?.getAttribute("cx"))
      .toBe(head.getAttribute("cx"));
  });

  it("chips the head when the numeral dropped for want of room", async () => {
    // 60 units wide cannot seat "9,876,543", so `label="last"` prints nothing —
    // and the chip is what the head reads out instead.
    const screen = await render(<CometTrail data={[1234567, 7654321, 9876543]} title="Price" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('text[data-mc-ink="label"]')).toBeNull();
    fig.focus();
    await userEvent.keyboard("{End}");
    await expect.poll(() => fig.querySelector(".mc-spark-readout")?.textContent).toBe("9,876,543");
  });

  it("readout={false} keeps the ring and onActive, drops only the chip", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <CometTrail data={RISING} readout={false} onActive={(d) => seen.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 40, formatted: "40" });
    expect(fig.querySelector('circle[data-mc-w="support"]')).not.toBeNull();
    expect(fig.querySelector(".mc-spark-readout")).toBeNull();
  });
});
