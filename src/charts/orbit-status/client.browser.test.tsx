import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { OrbitStatus } from "./client.js";

describe("interactive <OrbitStatus> (plan/24 #22)", () => {
  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(
      <OrbitStatus
        latency={240}
        rate={12}
        latencyDomain={[0, 500]}
        rateDomain={[0, 20]}
        title="Payments API"
      />,
    );
    const wrap = screen.container.querySelector(".mc-orbit-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Payments API. 240ms latency at 12 calls/s.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("orbits the satellite when the rate is nonzero", async () => {
    const screen = await render(
      <OrbitStatus latency={240} rate={12} rateDomain={[0, 20]} title="API" />,
    );
    const sat = screen.container.querySelector(".mc-orbit-satellite") as SVGCircleElement;
    await vi.waitFor(() => expect(sat.getAnimations().length).toBeGreaterThan(0));
  });

  it("does not orbit when the rate is zero (solid orbit)", async () => {
    const screen = await render(<OrbitStatus latency={240} rate={0} title="API" />);
    const sat = screen.container.querySelector(".mc-orbit-satellite") as SVGCircleElement;
    await new Promise((r) => setTimeout(r, 50));
    expect(sat.getAnimations().length).toBe(0);
  });

  it("announces when latency crosses the alert threshold", async () => {
    const screen = await render(
      <OrbitStatus latency={200} rate={5} alert={300} latencyDomain={[0, 500]} title="API" />,
    );
    const live = screen.container.querySelector('[aria-live="polite"]')!;
    await screen.rerender(
      <OrbitStatus latency={350} rate={5} alert={300} latencyDomain={[0, 500]} title="API" />,
    );
    expect(live.textContent).toBe("Latency high — 350ms.");
  });
});
