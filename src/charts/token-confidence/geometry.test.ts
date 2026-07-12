import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { tokenTierCounts, tokenTiers } from "./geometry.js";

describe("tokenTiers", () => {
  it("maps confidence to three discrete tiers", () => {
    const t = tokenTiers({
      data: [
        { token: "a", confidence: 0.95 },
        { token: "b", confidence: 0.62 },
        { token: "c", confidence: 0.2 },
      ],
      tiers: [0.5, 0.8],
    });
    expect(t.map((x) => x.tier)).toEqual(["confident", "unsure", "guessing"]);
  });

  it("non-finite confidence → guessing (flag it)", () => {
    const t = tokenTiers({ data: [{ token: "x", confidence: Number.NaN }], tiers: [0.5, 0.8] });
    expect(t[0]!.tier).toBe("guessing");
  });

  it("boundary: c === hi is confident, c === lo is unsure", () => {
    const t = tokenTiers({
      data: [
        { token: "hi", confidence: 0.8 },
        { token: "lo", confidence: 0.5 },
      ],
      tiers: [0.5, 0.8],
    });
    expect(t.map((x) => x.tier)).toEqual(["confident", "unsure"]);
  });

  it("counts partition the tokens exactly", () => {
    const t = tokenTiers({
      data: Array.from({ length: 10 }, (_, i) => ({ token: `t${i}`, confidence: i / 10 })),
      tiers: [0.5, 0.8],
    });
    const c = tokenTierCounts(t);
    expect(c.confident + c.unsure + c.guessing).toBe(10);
  });

  test.prop([
    fc.array(fc.double({ min: 0, max: 1, noNaN: true }), { minLength: 1, maxLength: 50 }),
  ])("tiering is total and stable", (confs) => {
    const t = tokenTiers({
      data: confs.map((c, i) => ({ token: `${i}`, confidence: c })),
      tiers: [0.5, 0.8],
    });
    const counts = tokenTierCounts(t);
    expect(counts.confident + counts.unsure + counts.guessing).toBe(confs.length);
  });
});
