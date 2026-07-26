import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { HeartbeatBlip } from "./client.js";
import { pointerAway } from "../../test/pointer.js";

describe("interactive <HeartbeatBlip>", () => {
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

  it("click fires onSelect with the in-window event count", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <HeartbeatBlip
        events={[97_000, 90_000, 80_000]}
        now={100_000}
        onSelect={(d) => picks.push(d)}
      />,
    );
    const wrap = screen.container.querySelector(".mc-heartbeat-live") as HTMLElement;
    wrap.click();
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 3, label: "minute" });
  });

  it("Enter fires onSelect", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <HeartbeatBlip events={[95_000]} now={100_000} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-heartbeat-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 1, label: "minute" });
  });

  it('hover reveals the in-window count; label="count" suppresses the chip', async () => {
    const screen = await render(
      <HeartbeatBlip events={[97_000, 90_000, 80_000]} now={100_000} title="Requests" />,
    );
    const wrap = screen.container.querySelector(".mc-heartbeat-live") as HTMLElement;
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await userEvent.hover(wrap);
    await expect.poll(chip).toBe("3 events");
    await pointerAway();
    await expect.poll(chip).toBeUndefined();

    const labelled = await render(
      <HeartbeatBlip events={[97_000, 90_000]} now={100_000} label="count" />,
    );
    const lw = labelled.container.querySelector(".mc-heartbeat-live") as HTMLElement;
    await userEvent.hover(lw);
    expect(lw.querySelector(".mc-spark-readout")).toBeNull();
  });

  // Edge-only `onActive` — shared/interactive.ts; pointerAway() before blur (src/test/pointer.ts).
  it("onActive reports the trace once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <HeartbeatBlip
        events={[97_000, 90_000, 80_000]}
        now={100_000}
        onActive={(d) => seen.push(d)}
      />,
    );
    const wrap = screen.container.querySelector(".mc-heartbeat-live") as HTMLElement;
    await userEvent.hover(wrap);
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await expect.poll(chip).toBe("3 events");
    // the datum carries the chip's own string, so a consumer can render it
    expect(seen.at(-1)).toMatchObject({
      index: 0,
      value: 3,
      label: "minute",
      formatted: chip(),
    });
    wrap.focus(); // already active — must not re-announce
    expect(seen.length).toBe(1);
    // pointerAway before blur — see src/test/pointer.ts (hover+blur order flakes edge counts).
    await pointerAway();
    await expect.poll(() => seen.at(-1)).toBeNull();
    wrap.blur(); // already cleared — must not re-announce
    expect(seen.length).toBe(2);
  });
});
