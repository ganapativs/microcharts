import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { RetentionCurve } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { expectHostsAnnotations } from "../../test/annotation-host.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const SAMPLE = [1, 0.71, 0.52, 0.43, 0.37, 0.344, 0.341, 0.34];

describe("<RetentionCurve>", () => {
  it("summary states last retention + plateau — the real string", () => {
    const { container } = draw(<RetentionCurve data={SAMPLE} unit="week" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "34% retained after 8 weeks; curve plateaus from week 5.",
    );
  });

  it("no-plateau curve omits the plateau clause", () => {
    const { container } = draw(
      <RetentionCurve data={[1, 0.8, 0.6, 0.45, 0.32, 0.22]} unit="week" />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "22% retained after 6 weeks.",
    );
  });

  it("step line by default + endpoint dot + plateau marker", () => {
    const { container } = draw(<RetentionCurve data={SAMPLE} />);
    const d = container.querySelector('path[data-mc-ink="data"]')!.getAttribute("d")!;
    expect(d).toMatch(/[HV]/); // step
    expect(container.querySelector("circle")).not.toBeNull();
    expect(container.querySelectorAll("line").length).toBe(1); // plateau marker
  });

  it("benchmark renders a dashed muted ghost behind the line", () => {
    const { container } = draw(<RetentionCurve data={SAMPLE} benchmark={[1, 0.6, 0.44, 0.36]} />);
    const ghost = container.querySelector('path[data-mc-ink="muted"]')!;
    expect(ghost.getAttribute("stroke-dasharray")).toBe("2.5 2");
  });

  it("label='last' states the final retention; 'none' shows no text", () => {
    const labeled = draw(<RetentionCurve data={SAMPLE} />).container;
    const none = draw(<RetentionCurve data={SAMPLE} label="none" />).container;
    expect(labeled.querySelector("text")!.textContent).toBe("34%");
    expect(none.querySelector("text")).toBeNull();
  });

  it("plateau period in the name matches the marker's x (gaps included)", () => {
    const gappy = [1, Number.NaN, Number.NaN, 0.5, 0.34, 0.341, 0.34, 0.339];
    const { container } = draw(<RetentionCurve data={gappy} unit="week" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "34% retained after 8 weeks; curve plateaus from week 5.",
    );
    // …and the rule starts at that same period, not two gaps to its left.
    expect(container.querySelector("line")!.getAttribute("x1")).toBe("56.29");
  });

  // `.mc-root` sets forced-color-adjust: none, so any inline paint survives
  // High Contrast Mode verbatim. Both marks carry an ink role instead, and the
  // label leaves tabular-nums to styles.css (inline would defeat the :where()
  // consumer-override contract).
  it("plateau rule + endpoint paint through ink roles, not inline color", () => {
    const { container } = draw(<RetentionCurve data={SAMPLE} />);
    const rule = container.querySelector("line")!;
    expect(rule.getAttribute("data-mc-ink")).toBe("ghost");
    expect(rule.getAttribute("stroke")).toBeNull();
    const dot = container.querySelector("circle")!;
    expect(dot.getAttribute("data-mc-ink")).toBe("accent");
    expect(dot.getAttribute("style")).toBeNull();
    expect(container.querySelector("text")!.style.fontVariantNumeric).toBe("");
  });

  it("an explicit color still overrides the endpoint inline", () => {
    const { container } = draw(<RetentionCurve data={SAMPLE} color="rebeccapurple" />);
    expect(container.querySelector("circle")!.style.fill).toBe("rebeccapurple");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<RetentionCurve data={SAMPLE} title="W12 cohort" />);
    await expectNoA11yViolations(container);
  });

  it("hosts annotations (marks drawn + clamped in frame)", () => {
    expectHostsAnnotations(
      (children) => (
        <RetentionCurve data={SAMPLE} width={80} height={20} label="none" summary={false}>
          {children}
        </RetentionCurve>
      ),
      80,
      20,
    );
  });
});

seriesEdgeSuite("RetentionCurve", (data) => (
  <RetentionCurve data={data as number[]} title="Edge" />
));

// Degradation contract (tests/craft/floor.mjs): a label the box can no longer
// seat is DROPPED — never painted outside the viewBox, never stacked on a
// neighbour — the reserved gutter goes with it, and the mark still renders.
describe("RetentionCurve degradation", () => {
  it("the last-value readout drops under a 7-unit box, the curve still draws", () => {
    const big = draw(
      <RetentionCurve data={SAMPLE} unit="week" width={240} height={32} />,
    ).container;
    expect(big.querySelector("text")).not.toBeNull();

    const small = draw(
      <RetentionCurve data={SAMPLE} unit="week" width={48} height={6} />,
    ).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelectorAll("path").length).toBeGreaterThan(0);
  });
});
