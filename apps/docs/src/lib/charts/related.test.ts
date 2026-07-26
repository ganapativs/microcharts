import { describe, expect, it } from "vitest";
import { STABLE_CHARTS } from "./entries";
import { RELATED_COUNT, relatedCharts } from "./related";

// The "Related charts" block is an internal-linking surface: every chart page
// must link 3–5 real sibling pages, deterministically, on metadata alone.
describe("relatedCharts", () => {
  it("stays within the 3–5 design band", () => {
    expect(RELATED_COUNT).toBeGreaterThanOrEqual(3);
    expect(RELATED_COUNT).toBeLessThanOrEqual(5);
  });

  it.each(STABLE_CHARTS)("$slug gets a full, valid block", (chart) => {
    const related = relatedCharts(chart.slug);
    // full block on score alone — the backfill path must stay dormant today
    expect(related).toHaveLength(RELATED_COUNT);
    const slugs = related.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(related.length);
    expect(slugs).not.toContain(chart.slug);
    for (const c of related) {
      expect(c.status).toBe("stable");
      // tagline is the card copy — a blank one renders an empty link
      expect(c.tagline.length).toBeGreaterThan(0);
    }
  });

  it("is deterministic — same catalog in, same links out", () => {
    for (const chart of STABLE_CHARTS) {
      const a = relatedCharts(chart.slug).map((c) => c.slug);
      const b = relatedCharts(chart.slug).map((c) => c.slug);
      expect(a).toEqual(b);
    }
  });

  it("relates by shared shape/role, not alphabet", () => {
    // name-obvious siblings the scoring must keep finding; if one of these
    // regresses, the axes (collection/shape/channel/bestFor) drifted
    expect(relatedCharts("sparkline").map((c) => c.slug)).toContain("sparkbar");
    expect(relatedCharts("progress-ring").map((c) => c.slug)).toContain("progress");
    expect(relatedCharts("progress").map((c) => c.slug)).toContain("progress-ring");
    expect(relatedCharts("dice-pips").map((c) => c.slug)).toContain("tally-marks");
  });

  // Rails are a two-way surface: a chart nobody links to gets no inbound
  // internal links at all. The `bestFor` term used to compare whole free-text
  // phrases, so it almost never fired and the fourth slot fell back to registry
  // order — 17 charts were unreachable from every rail. Tokenised overlap cut
  // that to 8. Ratchet the ceiling down if it improves; never let it climb.
  it("leaves few charts out of every other chart's rail", () => {
    const linked = new Set<string>();
    for (const chart of STABLE_CHARTS) {
      for (const c of relatedCharts(chart.slug)) linked.add(c.slug);
    }
    const orphans = STABLE_CHARTS.filter((c) => !linked.has(c.slug)).map((c) => c.slug);
    expect(orphans.length, `unlinked charts: ${orphans.join(", ")}`).toBeLessThanOrEqual(8);
  });

  it("returns [] for an unknown slug", () => {
    expect(relatedCharts("not-a-chart")).toEqual([]);
  });

  it("respects an explicit count", () => {
    expect(relatedCharts("sparkline", 5)).toHaveLength(5);
    expect(relatedCharts("sparkline", 3)).toHaveLength(3);
  });
});
