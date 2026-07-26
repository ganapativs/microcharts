import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { OrbitStatus } from "./client.js";
import { pointerAway } from "../../test/pointer.js";

describe("interactive <OrbitStatus>", () => {
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
      <OrbitStatus latency={200} rate={5} threshold={300} latencyDomain={[0, 500]} title="API" />,
    );
    const live = screen.container.querySelector('[aria-live="polite"]')!;
    await screen.rerender(
      <OrbitStatus latency={350} rate={5} threshold={300} latencyDomain={[0, 500]} title="API" />,
    );
    expect(live.textContent).toBe("Latency high — 350ms.");
  });

  // ONE unit (the dependency) → the lean scalar contract: onSelect only.
  it("click fires onSelect with the latency", async () => {
    const onSelect = vi.fn();
    const screen = await render(
      <OrbitStatus
        latency={240}
        rate={12}
        latencyDomain={[0, 500]}
        title="API"
        onSelect={onSelect}
      />,
    );
    const fig = screen.container.querySelector(".mc-orbit-live") as HTMLElement;
    fig.click();
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ index: 0, value: 240, label: "API" }),
    );
  });

  it("Enter fires onSelect", async () => {
    const onSelect = vi.fn();
    const screen = await render(
      <OrbitStatus
        latency={240}
        rate={12}
        latencyDomain={[0, 500]}
        title="API"
        onSelect={onSelect}
      />,
    );
    const fig = screen.container.querySelector(".mc-orbit-live") as HTMLElement;
    fig.focus();
    fig.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ index: 0, value: 240, label: "API" }),
    );
  });

  it('label="latency" suppresses the chip (ms already beside the orbit)', async () => {
    const screen = await render(
      <OrbitStatus latency={240} rate={12} latencyDomain={[0, 500]} label="latency" />,
    );
    const fig = screen.container.querySelector(".mc-orbit-live") as HTMLElement;
    fig.focus();
    expect(fig.querySelector(".mc-spark-readout")).toBeNull();
  });

  // Edge-only `onActive` — shared/interactive.ts; pointerAway() before blur (src/test/pointer.ts).
  it("onActive reports the dependency once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <OrbitStatus
        latency={240}
        rate={12}
        latencyDomain={[0, 500]}
        title="API"
        onActive={(d) => seen.push(d)}
      />,
    );
    const fig = screen.container.querySelector(".mc-orbit-live") as HTMLElement;
    await userEvent.hover(fig);
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await expect.poll(chip).toBe("240ms");
    // the datum carries the chip's own string, so a consumer can render it
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 240, label: "API", formatted: chip() });
    fig.focus(); // already active — must not re-announce
    expect(seen.length).toBe(1);
    // pointerAway before blur — see src/test/pointer.ts (hover+blur order flakes edge counts).
    await pointerAway();
    await expect.poll(() => seen.at(-1)).toBeNull();
    fig.blur(); // already cleared — must not re-announce
    expect(seen.length).toBe(2);
  });
});
