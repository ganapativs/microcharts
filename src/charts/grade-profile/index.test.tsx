import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { GradeProfile, gradePercent, gradeProfileSummary, type GradePoint } from "./index.js";
import { gradeLayout, gradeProfileGeometry } from "./geometry.js";
import { EN_GRADE_PROFILE } from "../../core/strings-grade-profile.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const TRAIL: GradePoint[] = [
  { d: 0, elev: 800 },
  { d: 100, elev: 809 },
  { d: 250, elev: 812 },
  { d: 350, elev: 817 },
  { d: 500, elev: 835 },
  { d: 700, elev: 833 },
  { d: 900, elev: 865 },
];

describe("<GradeProfile>", () => {
  it("renders a quad per segment + a ridge summary", () => {
    const { container } = draw(<GradeProfile data={TRAIL} width={120} height={40} />);
    expect(container.querySelectorAll("path").length).toBe(TRAIL.length); // 6 quads + 1 ridge
    const geo = gradeProfileGeometry({
      data: TRAIL,
      width: 120,
      height: 40,
      bins: [3, 6, 10],
      topPad: gradeLayout(40, "max").topPad,
    });
    expect(
      gradeProfileSummary(
        geo,
        EN_GRADE_PROFILE,
        makeFormatter(undefined, undefined),
        gradePercent(undefined),
      ),
    ).toBe("900, 67 gain; steepest 16% at 800.");
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "900, 67 gain; steepest 16% at 800.",
    );
  });

  it("bins map to distinct ink/cat roles (gentle band → brutal bar)", () => {
    const { container } = draw(<GradeProfile data={TRAIL} width={120} height={40} />);
    expect(container.querySelector('path[data-mc-ink="band"]')).not.toBeNull(); // bin 0
    expect(container.querySelector('path[data-mc-cat="1"]')).not.toBeNull(); // bin 1
    expect(container.querySelector('path[data-mc-ink="negative"]')).not.toBeNull(); // bin 2
    expect(container.querySelector('path[data-mc-ink="bar"]')).not.toBeNull(); // bin 3
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull(); // ridge
  });

  it('label="max" seats a summit callout; label="none" drops it', () => {
    const withLabel = draw(<GradeProfile data={TRAIL} width={200} height={44} />).container;
    expect(withLabel.querySelector("text")!.textContent).toBe("16% max");
    const none = draw(<GradeProfile data={TRAIL} width={200} height={44} label="none" />).container;
    expect(none.querySelector("text")).toBeNull();
  });

  it("custom bins re-quantize the grades", () => {
    // raise the thresholds so the 9% and 12% pitches drop to gentler bins
    const { container } = draw(
      <GradeProfile data={TRAIL} bins={[10, 15, 20]} width={120} height={40} />,
    );
    expect(container.querySelector('path[data-mc-ink="bar"]')).toBeNull(); // nothing ≥ 20%
  });

  it("collapses to two tones below 72 units wide", () => {
    const { container } = draw(<GradeProfile data={TRAIL} width={60} height={24} />);
    expect(container.querySelector('path[data-mc-cat="1"]')).toBeNull();
    expect(container.querySelector('path[data-mc-ink="bar"]')).toBeNull();
    expect(container.querySelector('path[data-mc-ink="negative"]')).not.toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <GradeProfile data={TRAIL} title="Route profile" width={200} height={44} />,
    );
    await expectNoA11yViolations(container);
  });
});

describe("<GradeProfile> edge cases", () => {
  const cases: Record<string, GradePoint[]> = {
    empty: [],
    "single point": [{ d: 0, elev: 500 }],
    "flat route": [
      { d: 0, elev: 500 },
      { d: 300, elev: 500 },
    ],
    "descent only": [
      { d: 0, elev: 900 },
      { d: 200, elev: 860 },
      { d: 400, elev: 800 },
    ],
    "NaN elevation": [
      { d: 0, elev: 100 },
      { d: 100, elev: 120 },
      { d: 200, elev: Number.NaN },
      { d: 300, elev: 160 },
    ],
  };
  for (const [label, data] of Object.entries(cases)) {
    it(`${label} → renders, no non-finite leak, keeps the a11y name`, () => {
      const { container } = draw(<GradeProfile data={data} title="Edge" width={120} height={40} />);
      expect(container.firstElementChild).not.toBeNull();
      for (const el of container.querySelectorAll("*")) {
        for (const attr of ["d", "x", "y", "x1", "x2", "y1", "y2", "aria-label"]) {
          const v = el.getAttribute(attr);
          if (v !== null) expect(v).not.toMatch(/NaN|Infinity/);
        }
      }
      expect(container.querySelector('[role="img"][aria-label]')).not.toBeNull();
    });
  }

  it("flat and descent-only routes report no real climb", () => {
    const flat = gradeProfileGeometry({
      data: cases["flat route"]!,
      width: 120,
      height: 40,
      bins: [3, 6, 10],
      topPad: gradeLayout(40, "max").topPad,
    });
    expect(
      gradeProfileSummary(
        flat,
        EN_GRADE_PROFILE,
        makeFormatter(undefined, undefined),
        gradePercent(undefined),
      ),
    ).toBe("300, no real climb.");
  });
});
