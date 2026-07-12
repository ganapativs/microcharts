import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { heartbeatGeometry } from "./geometry.js";

const g = (events: readonly number[], now = 100_000, win = 60_000) =>
  heartbeatGeometry({ events, window: win, now, width: 60, height: 16, pad: 1 });

describe("heartbeatGeometry — event liveness", () => {
  it("counts in-window events and builds a spike per event", () => {
    const geo = g([97_000, 90_000, 80_000]);
    expect(geo.count).toBe(3);
    expect((geo.spikesPath.match(/M/g) ?? []).length).toBe(3);
  });

  it("drops events older than the window", () => {
    const geo = g([97_000, 30_000]); // 30_000 is before now-window (40_000)
    expect(geo.count).toBe(1);
  });

  it("lastAgoMs is measured from the most recent in-window event", () => {
    expect(g([97_000, 90_000]).lastAgoMs).toBe(3_000);
  });

  it("clamps events after now (clock skew) to now", () => {
    const geo = g([110_000]); // future event
    expect(geo.count).toBe(1);
    expect(geo.lastAgoMs).toBe(0);
  });

  it("no events → empty spike path, flat baseline, null lastAgo", () => {
    const geo = g([]);
    expect(geo.spikesPath).toBe("");
    expect(geo.count).toBe(0);
    expect(geo.lastAgoMs).toBeNull();
  });

  it("baseline spans the width; now dot sits at the right edge", () => {
    const geo = g([90_000]);
    expect(geo.baseline.x1).toBeLessThan(geo.baseline.x2);
    expect(geo.nowDot.cx).toBeCloseTo(geo.width - 2.5, 1); // inset for the accent cursor
  });

  test.prop([fc.array(fc.integer({ min: 40_000, max: 100_000 }), { maxLength: 30 })])(
    "every spike coordinate stays inside the box",
    (events) => {
      const geo = g(events);
      const nums = geo.spikesPath.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
      for (let i = 0; i < nums.length; i += 2) {
        expect(nums[i]!).toBeGreaterThanOrEqual(-0.6);
        expect(nums[i]!).toBeLessThanOrEqual(geo.width + 0.6);
      }
    },
  );
});
