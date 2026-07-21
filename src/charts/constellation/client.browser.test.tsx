import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Constellation } from "./client.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const monthFmt = (x: number) => MONTHS[x] ?? String(x);

const EVENTS = [
  { x: 0, y: 40, m: 2 },
  { x: 2, y: 90, m: 7 },
  { x: 5, y: 30, m: 3 },
] as const;

/** The pinned selection ring — heavier than the transient focus ring, and the
 *  only `w="full"` mark in the chart (the static halo + connector use "tick"). */
const PIN = 'circle[data-mc-w="full"]';

describe("interactive <Constellation>", () => {
  it("arrow keys step chronologically and announce time + value + magnitude", async () => {
    const screen = await render(
      <Constellation data={EVENTS} xFormat={monthFmt} title="Incidents" />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Jan: 40, magnitude 2.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Mar: 90, magnitude 7.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(
      <Constellation data={EVENTS} xFormat={monthFmt} title="Incidents" />,
    );
    const wrap = screen.container.querySelector(".mc-constellation-live")!;
    expect(wrap.getAttribute("aria-label")).toBe(
      "Incidents. 3 events between Jan and Jun; largest at Mar.",
    );
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("onActive reports the focused star (data index + value); null on Escape", async () => {
    const onActive = vi.fn();
    const screen = await render(
      <Constellation data={EVENTS} xFormat={monthFmt} onActive={onActive} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onActive).toHaveBeenLastCalledWith(
      expect.objectContaining({ index: 0, value: 40, label: "Jan" }),
    );
    await userEvent.keyboard("{ArrowRight}");
    expect(onActive).toHaveBeenLastCalledWith(
      expect.objectContaining({ index: 1, value: 90, label: "Mar" }),
    );
    await userEvent.keyboard("{Escape}");
    expect(onActive).toHaveBeenLastCalledWith(null);
  });

  it("Enter selects the active star, fires onSelect and pins a ring that survives blur", async () => {
    const onSelect = vi.fn();
    const screen = await render(
      <Constellation data={EVENTS} xFormat={monthFmt} onSelect={onSelect} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ index: 1, value: 90, label: "Mar" }),
    );
    fig.blur();
    await expect.poll(() => fig.querySelectorAll(PIN).length).toBe(1);
  });

  it("controlled selectedIndex pins a star with no interaction", async () => {
    const screen = await render(
      <Constellation data={EVENTS} xFormat={monthFmt} selectedIndex={2} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    const pin = fig.querySelectorAll(PIN);
    expect(pin.length).toBe(1);
    // the third event's star — x=5 sits at the right edge of the 60-unit box
    expect(Number(pin[0]!.getAttribute("cx"))).toBeGreaterThan(30);
  });
});
