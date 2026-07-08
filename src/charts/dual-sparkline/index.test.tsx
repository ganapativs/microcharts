import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { DualSparkline } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const YOU = [12, 13, 12, 14, 15, 14, 16, 15, 17, 16, 17, 17];
const PLAN = [12, 12, 13, 13, 13, 14, 14, 14, 15, 15, 15, 15];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<DualSparkline> (plan/22 #22)", () => {
  it("dashed reference behind a solid primary; docs-as-tests summary", () => {
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

  it("is axe-clean", async () => {
    const { container } = draw(<DualSparkline data={YOU} compare={PLAN} title="You vs plan" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("DualSparkline", (data) => (
  <DualSparkline data={data} compare={[3, 4, 5]} title="Edge" />
));
