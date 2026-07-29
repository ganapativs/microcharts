import { describe, it, expect, vi } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ControlStrip } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import { expectHostsAnnotations } from "../../test/annotation-host.js";

const hollow = (el: Element) => el.getAttribute("fill") === "none";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const SAMPLE = [10, 11, 9, 10, 11, 9, 10, 10, 11, 9, 10, 16];

describe("<ControlStrip>", () => {
  it("summary states out count, center, and limits — the real string", () => {
    const { container } = draw(<ControlStrip data={SAMPLE} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "1 of 12 points outside control limits (center 10.5, limits 6.15–14.85).",
    );
  });

  it("in-control series reads 'All N points within control limits'", () => {
    const { container } = draw(<ControlStrip data={[10, 11, 9, 10, 11, 9, 10, 10, 11, 9]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "All 10 points within control limits",
    );
  });

  it("n < 10 appends 'Limits provisional'", () => {
    const { container } = draw(<ControlStrip data={[10, 11, 9, 10, 12, 8]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "Limits provisional (n=6)",
    );
  });

  it("only out-of-control points get a ringed marker (in-control look boring)", () => {
    const { container } = draw(<ControlStrip data={SAMPLE} />);
    // the spike → a ring (2 circles: outer ring + filled core); no other dots
    expect(container.querySelectorAll("circle").length).toBe(2);
  });

  it("dots='all' marks every point", () => {
    const { container } = draw(<ControlStrip data={SAMPLE} dots="all" />);
    // 11 in-control dots + 2 (ring+core) for the out point
    expect(container.querySelectorAll("circle").length).toBe(13);
  });

  it("dots='none' draws no point marks at all", () => {
    const { container } = draw(<ControlStrip data={SAMPLE} dots="none" />);
    expect(container.querySelectorAll("circle").length).toBe(0);
  });

  it("band + center hairline render", () => {
    const { container } = draw(<ControlStrip data={SAMPLE} />);
    expect(container.querySelector('[data-mc-ink="band"]')).not.toBeNull();
    expect(container.querySelectorAll("line").length).toBe(1); // center
  });

  it("provisional limits render a dashed band border", () => {
    const { container } = draw(<ControlStrip data={[10, 11, 9, 10, 12, 8]} />);
    // a separate muted outline rect — the band role's `stroke: none` CSS rule
    // would override stroke attributes set on the band rect itself
    const outline = container.querySelector('rect[data-mc-ink="muted"]')!;
    expect(outline.getAttribute("stroke-dasharray")).toBe("2 2");
    expect(outline.getAttribute("data-mc-w")).toBe("hair");
  });

  // Hostile CONFIG, not hostile data — the shared edge matrix only sweeps
  // `data`. A scalar config prop can render a perfectly ordinary strip while the
  // accessible name announces a scale the band was never drawn on.
  it.each([
    ["baseline NaN", { baseline: Number.NaN }],
    ["baseline Infinity", { baseline: Number.POSITIVE_INFINITY }],
    ["baseline -Infinity", { baseline: Number.NEGATIVE_INFINITY }],
    ["baseline past the rounder", { baseline: 1e308 }],
    ["domain NaN", { domain: [Number.NaN, 10] as [number, number] }],
    ["domain Infinity", { domain: [0, Number.POSITIVE_INFINITY] as [number, number] }],
    ["domain flat", { domain: [5, 5] as [number, number] }],
    ["percentile limits", { limits: "percentile" as const }],
  ])("%s: nothing non-finite reaches the name or an attribute", (_name, extra) => {
    const { container } = draw(<ControlStrip data={SAMPLE} dots="all" {...extra} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).not.toMatch(/NaN|Infinity|∞/);
    for (const el of container.querySelectorAll("*")) {
      for (const attr of Array.from(el.attributes)) {
        expect(attr.value, `<${el.tagName} ${attr.name}>`).not.toMatch(/NaN|Infinity/);
      }
    }
  });

  it("a long series keys marks by index, not by x (2-dp coords collide)", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const many = Array.from({ length: 9000 }, (_, i) => (i % 7) - 3);
    const { container } = draw(<ControlStrip data={many} dots="all" />);
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
    expect(container.querySelectorAll("circle").length).toBe(9000);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<ControlStrip data={SAMPLE} title="Line 3 fill weight" />);
    await expectNoA11yViolations(container);
  });

  it("hosts annotations (marks drawn + clamped in frame)", () => {
    expectHostsAnnotations(
      (children) => (
        <ControlStrip data={SAMPLE} width={80} height={20} summary={false}>
          {children}
        </ControlStrip>
      ),
      80,
      20,
    );
  });

  // Degradation contract: see tests/craft/floor.mjs.
  it("short box: the out-of-control halo drops rather than being struck through", () => {
    const series = [10, 11, 9, 10, 11, 9, 10, 10, 11, 9, 10, 16, 10, 9, 11, 10];
    const big = draw(<ControlStrip data={series} width={240} height={28} />).container;
    expect([...big.querySelectorAll("circle")].some(hollow)).toBe(true);

    const small = draw(<ControlStrip data={series} width={72} height={8} />).container;
    const centerY = Number(small.querySelector("line")!.getAttribute("y1"));
    // no hollow ring is left with the centre hairline crossing its interior
    for (const c of [...small.querySelectorAll("circle")].filter(hollow)) {
      const cy = Number(c.getAttribute("cy"));
      expect(Math.abs(cy - centerY)).toBeGreaterThanOrEqual(Number(c.getAttribute("r")));
    }
    // the out-of-control point is still marked, and still by shape+size
    const filled = [...small.querySelectorAll("circle")].filter((c) => !hollow(c));
    expect(filled.length).toBeGreaterThanOrEqual(1);
    expect(filled.some((c) => c.getAttribute("data-mc-ink") === "negative")).toBe(true);
  });
});

seriesEdgeSuite("ControlStrip", (data) => <ControlStrip data={data as number[]} title="Edge" />);
