import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { StackedArea } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const TRAFFIC = [
  { label: "Mobile", values: [30, 35, 40, 42, 45] },
  { label: "Web", values: [40, 39, 38, 38, 38] },
  { label: "API", values: [15, 16, 17, 17, 17] },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<StackedArea>", () => {
  it("≤ 3 stacked layers summary names the leader", () => {
    const { container } = draw(<StackedArea data={TRAFFIC} />);
    expect(container.querySelectorAll("g").length).toBe(3);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "3 series over 5 points; Mobile leads at 45% share.",
    );
  });

  it("negative values dev-warn (clamped by the kernel)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    draw(<StackedArea data={[{ values: [5, -3, 4] }]} />);
    expect(warn).toHaveBeenCalled();
  });

  it("> 3 series dev-warns and renders only 3", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(
      <StackedArea data={[...TRAFFIC, { label: "Extra", values: [1, 2, 3] }]} />,
    );
    expect(container.querySelectorAll("g").length).toBe(3);
    expect(warn).toHaveBeenCalled();
  });

  it("mode='ridge' renders opaque fills (same stack, new skin)", () => {
    const { container } = draw(<StackedArea data={TRAFFIC} mode="ridge" />);
    const first = container.querySelector("g path") as SVGElement;
    expect(first.style.fillOpacity).toBe("1");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<StackedArea data={TRAFFIC} title="Traffic mix" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("StackedArea", (data) => (
  <StackedArea data={[{ label: "A", values: data }]} title="Edge" />
));

describe("<StackedArea> colors", () => {
  it("colors[] overrides the series palette, cycling", () => {
    const { container } = draw(
      <StackedArea data={TRAFFIC} colors={["rgb(1, 2, 3)", "rgb(4, 5, 6)"]} />,
    );
    const areas = [...container.querySelectorAll("path")].filter((p) =>
      p.getAttribute("data-mc-cat"),
    ) as SVGElement[];
    expect(areas[0]!.style.fill).toBe("rgb(1, 2, 3)");
    expect(areas[1]!.style.fill).toBe("rgb(4, 5, 6)");
    expect(areas[2]!.style.fill).toBe("rgb(1, 2, 3)");
    expect(areas[0]!.getAttribute("data-mc-cat")).toBe("1");
  });
});
