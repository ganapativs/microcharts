import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { TapeGauge } from "./client.js";

const ZONES = [{ from: 130, to: 150, tone: "warn" as const }];

describe("interactive <TapeGauge>", () => {
  it("announces the full reading in a live region", async () => {
    const screen = await render(
      <TapeGauge value={142} rate={1} zones={ZONES} span={25} title="Airspeed" height={80} />,
    );
    const wrap = screen.container.querySelector(".mc-tape-live") as HTMLElement;
    expect(wrap.getAttribute("aria-label")).toContain("Now 142");
    const live = wrap.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toContain("Now 142, rising");
  });
});
