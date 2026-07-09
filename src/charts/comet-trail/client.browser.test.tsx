import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { CometTrail } from "./client.js";

const RISING = [40, 45, 50, 55, 60, 65, 70, 72, 75, 78, 80, 84, 87];

describe("interactive <CometTrail> (plan/24 #21)", () => {
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

  it("Left arrow steps back through the trail", async () => {
    const screen = await render(<CometTrail data={RISING} title="Price" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(live.textContent).toBe("1 updates ago: 84.");
  });
});
