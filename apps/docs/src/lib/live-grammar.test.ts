import { describe, expect, it } from "vitest";
import { LIVE_FEW_SHOTS, parseLiveReply, speakLiveReply, type LiveSeg } from "./live-grammar";

const charts = (segs: LiveSeg[]) => segs.filter((s) => s.kind === "chart");

describe("parseLiveReply — inline forms", () => {
  it("parses a complete inline sparkline", () => {
    const segs = parseLiveReply("Revenue built `microchart sparkline 3 5 4 8`, nice.");
    expect(segs).toHaveLength(3);
    const c = segs[1];
    expect(c).toMatchObject({
      kind: "chart",
      block: false,
      complete: true,
      spec: { type: "sparkline", values: [3, 5, 4, 8] },
    });
    expect(segs[2]).toEqual({ kind: "text", text: ", nice." });
  });

  it("keeps an unterminated backtick in flight", () => {
    const segs = parseLiveReply("Revenue built `microchart sparkli");
    const c = segs[1];
    expect(c).toMatchObject({
      kind: "chart",
      complete: false,
      spec: null,
      raw: "`microchart sparkli",
    });
  });

  it("tolerates thousands commas, %, $, and a trailing period", () => {
    const segs = parseLiveReply("`microchart sparkbar 1,024 $95 88% 130.`");
    expect(charts(segs)[0].spec).toEqual({ type: "sparkbar", values: [1024, 95, 88, 130] });
  });

  it("rejects an unknown type but keeps it visible as raw", () => {
    const segs = parseLiveReply("`microchart pie 1 2 3`");
    expect(charts(segs)[0]).toMatchObject({
      complete: true,
      spec: null,
      raw: "`microchart pie 1 2 3`",
    });
  });

  it("rejects non-numeric series", () => {
    const segs = parseLiveReply("`microchart sparkline 3 five 4 8`");
    expect(charts(segs)[0].spec).toBeNull();
  });

  it("clamps oversize series to 24 points", () => {
    const nums = Array.from({ length: 40 }, (_, i) => i + 1).join(" ");
    const segs = parseLiveReply(`\`microchart sparkline ${nums}\``);
    const spec = charts(segs)[0].spec;
    expect(spec && spec.type === "sparkline" && spec.values.length).toBe(24);
  });

  it("reads delta as a fraction, normalizing percent-looking values", () => {
    const f = (s: string) => charts(parseLiveReply(s))[0].spec;
    expect(f("`microchart delta +0.184`")).toEqual({ type: "delta", value: 0.184 });
    expect(f("`microchart delta +18`")).toEqual({ type: "delta", value: 0.18 });
    expect(f("`microchart trend-arrow -5`")).toEqual({ type: "trend-arrow", value: -0.05 });
    expect(f("`microchart delta huge`")).toBeNull();
  });

  it("parses bullet key=value with optional bands", () => {
    expect(
      charts(parseLiveReply("`microchart bullet value=72 target=80 bands=50,90`"))[0].spec,
    ).toEqual({ type: "bullet", value: 72, target: 80, bands: [50, 90] });
    expect(charts(parseLiveReply("`microchart bullet value=72`"))[0].spec).toEqual({
      type: "bullet",
      value: 72,
    });
    expect(charts(parseLiveReply("`microchart bullet target=80`"))[0].spec).toBeNull();
  });

  it("accepts only known status-dot states", () => {
    expect(charts(parseLiveReply("`microchart status-dot warn`"))[0].spec).toEqual({
      type: "status-dot",
      status: "warn",
    });
    expect(charts(parseLiveReply("`microchart status-dot exploded`"))[0].spec).toBeNull();
  });

  it("rejects a removed type (streak) but keeps it visible as raw", () => {
    expect(charts(parseLiveReply("`microchart streak 1 1 -1 1`"))[0]).toMatchObject({
      complete: true,
      spec: null,
    });
  });

  it("treats non-chart inline code as literal code", () => {
    const segs = parseLiveReply("Install `npm i @microcharts/react` first.");
    expect(segs[1]).toEqual({ kind: "code", text: "npm i @microcharts/react" });
  });
});

describe("parseLiveReply — fenced forms", () => {
  it("parses a labeled mini-bar block", () => {
    const segs = parseLiveReply(
      "Broad growth:\n```microchart mini-bar Net-new by region ($k)\nNA 48\nEU 39\nUK 27\n```\nDone.",
    );
    const c = charts(segs)[0];
    expect(c.block).toBe(true);
    expect(c.spec).toEqual({
      type: "mini-bar",
      title: "Net-new by region ($k)",
      items: [
        { label: "NA", value: 48 },
        { label: "EU", value: 39 },
        { label: "UK", value: 27 },
      ],
    });
  });

  it("supports multi-word labels and clamps their length", () => {
    const segs = parseLiveReply(
      "```microchart mini-bar Mix\nNorth America somewhere far 48\nEU 39\n```",
    );
    const spec = charts(segs)[0].spec;
    expect(spec && spec.type === "mini-bar" && spec.items[0]).toEqual({
      label: "North America so",
      value: 48,
    });
  });

  it("parses a segmented mix block with labeled lines", () => {
    const segs = parseLiveReply(
      "```microchart segmented Sessions by source\nOrganic 46\nPaid 24\n```",
    );
    expect(charts(segs)[0].spec).toEqual({
      type: "segmented",
      title: "Sessions by source",
      items: [
        { label: "Organic", value: 46 },
        { label: "Paid", value: 24 },
      ],
    });
  });

  it("parses histogram/seismogram number lines and enforces a minimum", () => {
    const ok = parseLiveReply("```microchart seismogram Errors per minute\n2 1 3 2 18 24 9\n```");
    expect(charts(ok)[0].spec).toMatchObject({ type: "seismogram", title: "Errors per minute" });
    const short = parseLiveReply("```microchart histogram t\n1 2 3\n```");
    expect(charts(short)[0].spec).toBeNull();
  });

  it("trims separator newlines around a block so it doesn't add phantom lines", () => {
    const segs = parseLiveReply(
      "Balanced distribution:\n```microchart mini-bar Mix\nNA 48\nEU 39\n```\nOrganic keeps climbing.",
    );
    expect(segs).toHaveLength(3);
    expect(segs[0]).toEqual({ kind: "text", text: "Balanced distribution:" });
    expect(segs[2]).toEqual({ kind: "text", text: "Organic keeps climbing." });
  });

  it("keeps an unterminated fence in flight", () => {
    const segs = parseLiveReply("Spike:\n```microchart seismogram Errors\n2 1 3");
    expect(charts(segs)[0]).toMatchObject({ block: true, complete: false, spec: null });
  });

  it("treats a non-chart fence as literal code", () => {
    const segs = parseLiveReply("```js\nconsole.log(1)\n```");
    expect(segs[0]).toEqual({ kind: "code", text: "js\nconsole.log(1)" });
  });
});

describe("parseLiveReply — text hygiene", () => {
  it("strips bold markers, headings, and runaway blank lines", () => {
    const segs = parseLiveReply("## Recap\n\n\n\n**Q3** was __strong__.");
    expect(segs[0]).toEqual({ kind: "text", text: "Recap\n\nQ3 was strong." });
  });
});

describe("few-shot examples round-trip through the parser", () => {
  it("every chart in every example parses to a valid spec", () => {
    const assistant = LIVE_FEW_SHOTS.filter((m) => m.role === "assistant");
    expect(assistant.length).toBeGreaterThan(0);
    for (const m of assistant) {
      const cs = charts(parseLiveReply(m.content));
      expect(cs.length).toBeGreaterThanOrEqual(2);
      for (const c of cs) {
        expect(c.complete).toBe(true);
        expect(c.spec).not.toBeNull();
      }
    }
  });
});

describe("speakLiveReply — screen-reader prose", () => {
  it("flattens a reply's charts to words, leaving no grammar", () => {
    const spoken = speakLiveReply(
      "Revenue built `microchart sparkline 3 5 4 8`, up `microchart delta 0.18`.",
    );
    expect(spoken).not.toContain("`");
    expect(spoken).not.toContain("microchart");
    expect(spoken).toContain("Revenue built");
    // the series chart speaks its describeSeries summary
    expect(spoken.toLowerCase()).toMatch(/trending|range|value/);
  });

  it("every few-shot reply speaks as non-empty, grammar-free prose", () => {
    const assistant = LIVE_FEW_SHOTS.filter((m) => m.role === "assistant");
    for (const m of assistant) {
      const spoken = speakLiveReply(m.content);
      expect(spoken.length).toBeGreaterThan(0);
      expect(spoken).not.toContain("`");
      expect(spoken).not.toContain("microchart ");
    }
  });

  it("drops an in-flight chart rather than speaking half a tag", () => {
    expect(speakLiveReply("Revenue built `microchart sparkli")).toBe("Revenue built");
  });
});
