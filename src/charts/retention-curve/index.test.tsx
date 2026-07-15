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
