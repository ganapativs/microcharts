import { describe, it, expect } from "vitest";
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
});
