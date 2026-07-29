import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { DualSparkline } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import { expectHostsAnnotations } from "../../test/annotation-host.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const YOU = [12, 13, 12, 14, 15, 14, 16, 15, 17, 16, 17, 17];
const PLAN = [12, 12, 13, 13, 13, 14, 14, 14, 15, 15, 15, 15];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<DualSparkline>", () => {
  it("dashed reference behind a solid primary summary", () => {
    const { container } = draw(<DualSparkline data={YOU} compare={PLAN} />);
    const paths = [...container.querySelectorAll("path")];
    expect(paths.length).toBe(2);
    expect(paths[0]!.getAttribute("stroke-dasharray")).toBe("4 2"); // compare FIRST (behind)
    expect(paths[1]!.getAttribute("stroke-dasharray")).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Trending up 42% vs benchmark up 25%. Last 17 vs 15.",
    );
  });

  it("identical series → 'Matching benchmark.'", () => {
    const { container } = draw(<DualSparkline data={PLAN} compare={PLAN} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("Matching benchmark.");
  });

  it("all-null compare → dev warning + primary alone", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(<DualSparkline data={YOU} compare={[null, null]} />);
    expect(container.querySelectorAll("path").length).toBe(1);
    expect(warn).toHaveBeenCalled();
  });

  it("the reference endpoint dot is neutral ink, never an inline paint", () => {
    // An inline fill outranks the forced-colors mapping and would keep a warm
    // gray in High Contrast Mode (`.mc-root` is forced-color-adjust: none).
    const { container } = draw(<DualSparkline data={YOU} compare={PLAN} />);
    const dots = [...container.querySelectorAll("circle")];
    expect(dots.map((c) => c.getAttribute("data-mc-ink"))).toEqual(["neutral", "accent"]);
    for (const c of dots) expect(c.getAttribute("style")).toBeNull();
  });

  it("an endpoint label wider than the box drops instead of dragging the plot out of it", () => {
    const { container } = draw(
      <DualSparkline data={[1, 1234567890123]} compare={[1, 2]} label="last" />,
    );
    expect(container.querySelector("text")).toBeNull();
    for (const el of container.querySelectorAll("circle")) {
      expect(Number(el.getAttribute("cx"))).toBeGreaterThanOrEqual(0);
      expect(Number(el.getAttribute("cx"))).toBeLessThanOrEqual(60);
    }
    expect(container.querySelector("path")!.getAttribute("d")).not.toContain("-");
    // the value is still announced — only the painted figure yielded
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "Last 1,234,567,890,123",
    );
  });

  it("an affordable endpoint label is painted, seated inside the box", () => {
    const { container } = draw(<DualSparkline data={YOU} compare={PLAN} label="last" />);
    const text = container.querySelector("text")!;
    expect(text.textContent).toBe("17");
    expect(Number(text.getAttribute("y"))).toBeGreaterThanOrEqual(3.5); // fontSize 7 / 2
    expect(Number(text.getAttribute("y"))).toBeLessThanOrEqual(12.5);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<DualSparkline data={YOU} compare={PLAN} title="You vs plan" />);
    await expectNoA11yViolations(container);
  });

  it("hosts annotations (marks drawn + clamped in frame)", () => {
    expectHostsAnnotations(
      (children) => (
        <DualSparkline data={YOU} compare={PLAN} width={80} height={20} summary={false}>
          {children}
        </DualSparkline>
      ),
      80,
      20,
    );
  });
});

seriesEdgeSuite("DualSparkline", (data) => (
  <DualSparkline data={data} compare={[3, 4, 5]} title="Edge" />
));
