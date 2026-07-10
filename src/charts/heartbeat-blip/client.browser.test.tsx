import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { HeartbeatBlip } from "./client.js";

describe("interactive <HeartbeatBlip> (plan/24 #20)", () => {
  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(
      <HeartbeatBlip events={[97_000, 90_000, 80_000]} now={100_000} title="Requests" />,
    );
    const wrap = screen.container.querySelector(".mc-heartbeat-live")!;
    expect(wrap.getAttribute("aria-label")).toBe(
      "Requests. 3 events in the last minute; last 3s ago.",
    );
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("announces + blips the endpoint when a new event arrives", async () => {
    const screen = await render(
      <HeartbeatBlip events={[90_000, 80_000]} now={100_000} title="Requests" />,
    );
    const live = screen.container.querySelector('[aria-live="polite"]')!;
    await screen.rerender(
      <HeartbeatBlip events={[99_000, 90_000, 80_000]} now={100_000} title="Requests" />,
    );
    expect(live.textContent).toBe("3 events in the last minute; last 1s ago.");
    const dot = screen.container.querySelector(".mc-heartbeat-now") as SVGCircleElement;
    await vi.waitFor(() => expect(dot.getAnimations().length).toBeGreaterThan(0));
  });
});
