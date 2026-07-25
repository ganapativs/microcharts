import { describe, expect, it } from "vitest";
import { renderChart } from "../src/render-core";
import { LIBRARY_VERSION, STABLE_CHARTS } from "../src/catalog";

describe("render_microchart", () => {
  it("renders a self-contained SVG for a data chart", async () => {
    const r = await renderChart({ type: "sparkline", data: [3, 5, 4, 8, 6, 9, 7, 11] });
    expect(r.mimeType).toBe("image/svg+xml");
    expect(r.svg.startsWith("<svg")).toBe(true);
    expect(r.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(r.svg).toContain("<style>"); // self-contained by default
    expect(r.width).toBeGreaterThan(0);
    expect(r.height).toBeGreaterThan(0);
    expect(r.summary).toMatch(/trending/i);
    expect(r.library).toBe(LIBRARY_VERSION);
  });

  it("carries the real describeSeries-style alt text as summary", async () => {
    const r = await renderChart({ type: "sparkline", data: [10, 20, 30] });
    expect(r.summary.length).toBeGreaterThan(0);
    expect(r.summary).toContain("Range");
  });

  it("omits embedded CSS with format: bare", async () => {
    const r = await renderChart({ type: "sparkbar", data: [4, 6, 2, 8], format: "bare" });
    expect(r.svg).not.toContain("<style>");
    expect(r.svg.startsWith("<svg")).toBe(true);
  });

  it("renders scalar charts via props (no data)", async () => {
    const r = await renderChart({
      type: "bullet",
      props: { value: 72, target: 80, bands: [50, 90] },
    });
    expect(r.mimeType).toBe("image/svg+xml");
    expect(r.summary).toContain("80");
  });

  it("handles HTML-rooted inline marks (delta) with text/html", async () => {
    const r = await renderChart({ type: "delta", props: { value: 0.184 } });
    expect(r.mimeType).toBe("text/html");
    expect(r.summary).toMatch(/18\.4/);
  });

  it("rejects an unknown chart", async () => {
    await expect(renderChart({ type: "nope" })).rejects.toThrow(/unknown chart/i);
  });

  it("rejects oversized data (abuse guard)", async () => {
    const huge = Array.from({ length: 5001 }, (_, i) => i);
    await expect(renderChart({ type: "sparkline", data: huge })).rejects.toThrow(/exceeds/i);
  });

  it("rejects bulk hidden one level down (a point count only sees the top)", async () => {
    // 300k points in ONE series slipped past the old top-level count and
    // produced ~10 MB of markup.
    const nested = [{ label: "a", values: Array.from({ length: 300_000 }, (_, i) => (i % 7) + 1) }];
    await expect(renderChart({ type: "stacked-area", data: nested })).rejects.toThrow(/kB/);
  });

  it("names the missing prop and the data shape instead of throwing from React", async () => {
    await expect(renderChart({ type: "dot-plot" })).rejects.toThrow(
      /needs `data`.*\{ label, value \}\[\].*get_microchart/s,
    );
  });

  it("names a wrong-typed prop instead of letting React fail on it", async () => {
    await expect(renderChart({ type: "sparkline", data: "3,5,4" })).rejects.toThrow(
      /`data` must be number\[\], got string/,
    );
    await expect(renderChart({ type: "bullet", props: { value: "72" } })).rejects.toThrow(
      /`value` must be number, got string/,
    );
  });

  it.each([
    ["animate", { animate: true }, /interactive-only/],
    ["onActive", { onActive: "x" }, /interactive-only/],
    ["strings", { strings: { trendUp: "x" } }, /table of functions/],
    ["children", { children: "x" }, /React children/],
  ])("refuses `%s` — it cannot cross a tool call", async (_name, props, message) => {
    await expect(renderChart({ type: "sparkline", data: [1, 2, 3], props })).rejects.toThrow(
      message,
    );
  });

  it("reads the summary back when `id` switches the chart to title/desc", async () => {
    // With an `id` the chart drops `aria-label` for `<title>`/`<desc>` +
    // `aria-labelledby`; the generated sentence moves into `<desc>`. Reading
    // `<title>` alone returned the author's title and lost the data.
    const named = await renderChart({
      type: "sparkline",
      data: [1, 2, 3],
      props: { id: "rev", title: "Revenue" },
    });
    expect(named.summary).toBe("Revenue Trending up 200%. Range 1 to 3. Last value 3.");

    const untitled = await renderChart({
      type: "sparkline",
      data: [1, 2, 3],
      props: { id: "rev" },
    });
    expect(untitled.summary).toBe("Trending up 200%. Range 1 to 3. Last value 3.");
  });

  it("rejects a function-only prop declared by the chart itself", async () => {
    await expect(
      renderChart({ type: "constellation", data: [1, 2, 3], props: { xFormat: "x" } }),
    ).rejects.toThrow(/`xFormat` — a function/);
  });

  it("still accepts the JSON half of a union-typed prop", async () => {
    // `format` is `Intl.NumberFormatOptions | (n) => string` — the options half
    // is JSON, so it must survive the function-prop guard.
    const r = await renderChart({
      type: "sparkline",
      data: [1200, 1500, 1800],
      props: { format: { style: "currency", currency: "EUR" } },
    });
    expect(r.summary).toContain("€1,800.00");
  });

  it("refuses a non-positive box rather than emitting an invalid viewBox", async () => {
    await expect(
      renderChart({ type: "sparkline", data: [1, 2, 3], props: { width: -5 } }),
    ).rejects.toThrow(/invalid .* box/);
  });

  it("rejects data that is not plain JSON", async () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    await expect(renderChart({ type: "sparkline", data: cyclic })).rejects.toThrow(/cycle/);
  });
});

/**
 * The contract behind `get_microchart`'s `sample`: every stable chart ships a
 * JSON prop bag that renders. This is the one test that exercises all 106
 * charts through the real library, so a chart whose registry example drifts out
 * of sync with its component fails here rather than in a user's tool call.
 */
describe("every stable chart renders from its shipped sample", () => {
  it.each(STABLE_CHARTS.map((c) => [c.slug, c] as const))("%s", async (slug, chart) => {
    expect(chart.sample, `${slug} has no sample — check scripts/sample-props.ts`).toBeDefined();
    const r = await renderChart({ type: slug, props: chart.sample });
    expect(r.summary.length, `${slug} rendered without an accessible name`).toBeGreaterThan(0);
    expect(r.svg.length).toBeGreaterThan(0);
    if (r.mimeType === "image/svg+xml") {
      expect(r.width).toBeGreaterThan(0);
      expect(r.height).toBeGreaterThan(0);
    }
  });
});
