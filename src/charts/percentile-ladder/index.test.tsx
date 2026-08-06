import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { PercentileLadder } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const SAMPLE = Array.from({ length: 101 }, (_, i) => i);

describe("<PercentileLadder>", () => {
  it("summary names the tail multiple — the docs' real string", () => {
    const { container } = draw(<PercentileLadder data={SAMPLE} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "p50 50, p90 90, p99 99 — the slowest 1% take 2× the median.",
    );
  });

  it("default marks p50/p90/p99 with the tail strongest", () => {
    const { container } = draw(<PercentileLadder data={SAMPLE} />);
    const flags = container.querySelectorAll('[data-mc-ink="flag"]');
    expect(flags.length).toBe(1); // only the tail tick is the accent flag
  });

  it("log scale renders an in-chart tag so the transform is never silent", () => {
    const { container } = draw(<PercentileLadder data={[1, 10, 100, 1000]} scale="log" />);
    const tag = [...container.querySelectorAll("text")].find((t) => t.textContent === "log")!;
    expect(tag).toBeTruthy();
    // full label ink — a 0.7 fill-opacity put the tag under the text contrast
    // floor, and `forced-color-adjust: none` carried the fade into High Contrast
    expect(tag.style.fillOpacity).toBe("");
  });

  it("labels drop below the documented minimum width", () => {
    const wide = draw(<PercentileLadder data={SAMPLE} width={80} />).container;
    const narrow = draw(<PercentileLadder data={SAMPLE} width={40} />).container;
    expect(wide.querySelectorAll("text").length).toBeGreaterThan(0);
    expect(narrow.querySelectorAll("text").length).toBe(0);
  });

  it("the default ladder labels all three of its default percentiles", () => {
    // Regression: endpoint-first placement dropped the MIDDLE label, so at its
    // own default 80×12 the chart marked p50/p90/p99 and named p50 and p99.
    // A ladder that hides the rung a reader acts on is worse than a wider one.
    for (const width of [80, 110, 151]) {
      const { container } = draw(<PercentileLadder data={SAMPLE} width={width} />);
      const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
      expect(texts).toEqual(["50", "90", "99"]);
    }
  });

  it("a spread label stays on the rung it names", () => {
    // The spread nudges labels apart; the bound is that none of them lands
    // nearer another tick than its own, or the reader matches it to the wrong
    // percentile. Ticks and labels are in the same (ascending) DOM order.
    const { container } = draw(<PercentileLadder data={SAMPLE} width={80} />);
    const ticks = [...container.querySelectorAll("line[data-mc-ink]")]
      .filter((l) => l.getAttribute("data-mc-ink") !== "muted")
      .map((l) => Number(l.getAttribute("x1")));
    const labels = [...container.querySelectorAll("text")].map((t) => Number(t.getAttribute("x")));
    expect(labels.length).toBe(ticks.length);
    labels.forEach((x, i) => {
      const own = Math.abs(x - ticks[i]!);
      for (const t of ticks) expect(own).toBeLessThanOrEqual(Math.abs(x - t) + 1e-9);
    });
  });

  it("a hostile ps announces the ladder that was painted", () => {
    // p200 painted the maximum (quantiles clamps p) while the name announced
    // "p200 … the slowest -100%"; an empty ps announced "No data." over a
    // perfectly good series.
    const { container } = draw(<PercentileLadder data={SAMPLE} ps={[-10, 200]} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toBe(
      "p50 50, p90 90, p99 99 — the slowest 1% take 2× the median.",
    );
    expect(container.querySelectorAll("line").length).toBe(4); // track + 3 ticks
  });

  it("the tail multiple is measured against the median it names", () => {
    const { container } = draw(<PercentileLadder data={SAMPLE} ps={[25, 90]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "p25 25, p90 90 — the slowest 10% take 1.8× the median.",
    );
  });

  it("a non-finite box clamps the marks, not just the frame", () => {
    for (const box of [{ width: NaN }, { height: NaN }, { height: Infinity }, { width: 0 }]) {
      const { container } = draw(<PercentileLadder data={SAMPLE} {...box} />);
      const attrs = [...container.querySelectorAll("*")].flatMap((el) =>
        [...el.attributes].map((a) => a.value),
      );
      expect(attrs.filter((v) => /NaN|Infinity/.test(v))).toEqual([]);
    }
  });

  it("a label too wide for the box drops instead of painting into the margin", () => {
    // The seat clamp inverts once the text is wider than the room left over,
    // and `.mc-root` is overflow: visible — the winning bound spilled onto the
    // page.
    const wide = [1234567, 2234567, 9234567];
    const { container } = draw(
      <PercentileLadder data={wide} label="both" width={56} height={18} />,
    );
    for (const t of container.querySelectorAll("text")) {
      const est = (t.textContent ?? "").length * Number(t.getAttribute("font-size")) * 0.62;
      const cx = Number(t.getAttribute("x"));
      expect(cx - est / 2).toBeGreaterThanOrEqual(0);
      expect(cx + est / 2).toBeLessThanOrEqual(56);
    }
  });

  it("is axe-clean", async () => {
    const { container } = draw(<PercentileLadder data={SAMPLE} title="Latency percentiles" />);
    await expectNoA11yViolations(container);
  });

  // Degradation contract: see tests/craft/floor.mjs.
  it("short box: the log tag and its gutter drop together, ticks still render", () => {
    const sample = [120, 135, 128, 480, 142, 2100, 155, 138, 900, 148];
    const big = draw(
      <PercentileLadder data={sample} scale="log" width={240} height={20} />,
    ).container;
    expect([...big.querySelectorAll("text")].map((t) => t.textContent)).toContain("log");

    const small = draw(
      <PercentileLadder data={sample} scale="log" width={84} height={7} />,
    ).container;
    expect([...small.querySelectorAll("text")].map((t) => t.textContent)).not.toContain("log");
    // graduated ticks — the primary encoding — survive
    expect(small.querySelectorAll("line").length).toBeGreaterThanOrEqual(2);
    // the tag's left gutter went with it: the track starts at the bare pad
    const track = small.querySelector("line")!;
    expect(Number(track.getAttribute("x1"))).toBeLessThan(4);
  });
});

seriesEdgeSuite("PercentileLadder", (data) => <PercentileLadder data={data} title="Edge" />);
