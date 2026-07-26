import { describe, expect, it } from "vitest";
import { pushAnnouncement } from "./a11y-probe";
import { a11yLines, a11yProps, injectProps } from "./playground-a11y";

const ENTRY = {
  slug: "sparkline",
  tagline: "A trend over ordered values.",
  example: { title: "Weekly revenue" },
};
const JSX = ["<Sparkline", "  data={[1, 2, 3]}", '  curve="smooth"', "/>"].join("\n");

describe("playground naming knobs", () => {
  it("omits summary in auto mode — the library generates it", () => {
    expect(a11yProps("auto", true, false, ENTRY)).toEqual({
      title: "Weekly revenue",
      summary: undefined,
      id: undefined,
    });
  });

  it("passes false for the decorative opt-out", () => {
    expect(a11yProps("off", false, false, ENTRY).summary).toBe(false);
  });

  it("derives a stable id for the labelledby naming mode", () => {
    expect(a11yProps("auto", true, true, ENTRY).id).toBe("sparkline-demo");
  });

  it("renders the same props the preview gets, as snippet lines", () => {
    const props = a11yProps("custom", true, true, ENTRY);
    expect(injectProps(JSX, a11yLines(props, JSX))).toBe(
      [
        "<Sparkline",
        "  data={[1, 2, 3]}",
        '  curve="smooth"',
        '  title="Weekly revenue"',
        '  summary="A trend over ordered values."',
        '  id="sparkline-demo"',
        "/>",
      ].join("\n"),
    );
  });

  it("never duplicates a prop the chart's own snippet already sets", () => {
    const authored = ['<Sparkline data={[1]} title="Authored"', "/>"].join("\n");
    const out = injectProps(authored, a11yLines(a11yProps("auto", true, false, ENTRY), authored));
    expect(out.match(/title=/g)).toHaveLength(1);
  });

  it("leaves a snippet that isn't one self-closing element alone", () => {
    const wrapped = "<div>\n  <Sparkline data={[1]} />\n</div>";
    expect(injectProps(wrapped, ['  title="x"'])).toBe(wrapped);
  });

  it("adds nothing when every knob is at its default", () => {
    const props = a11yProps("auto", false, false, ENTRY);
    expect(injectProps(JSX, a11yLines(props, JSX))).toBe(JSX);
  });
});

describe("announcement log", () => {
  it("ignores the clear that follows every pointer-out", () => {
    const log = pushAnnouncement([], "Point 1 of 3: 5.", 0);
    expect(pushAnnouncement(log, "", 1)).toBe(log);
  });

  it("keeps a repeat — re-entering a point is a second utterance", () => {
    const log = pushAnnouncement([], "Point 1 of 3: 5.", 0);
    const again = pushAnnouncement(log, "Point 1 of 3: 5.", 1);
    expect(again.map((a) => a.id)).toEqual([1, 0]);
  });

  it("keeps the newest first and caps the log", () => {
    let log = pushAnnouncement([], "a", 0);
    for (const [i, t] of ["b", "c", "d", "e", "f", "g"].entries())
      log = pushAnnouncement(log, t, i + 1);
    expect(log.map((a) => a.text)).toEqual(["g", "f", "e", "d", "c", "b"]);
  });
});
