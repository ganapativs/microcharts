import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { RubricStrip, rubricStripSummary, type RubricStripDatum } from "./index.js";
import { EN_RUBRIC } from "../../core/strings-rubric.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);

const RUBRIC = [
  { label: "Correctness", score: 0.92, weight: 3 },
  { label: "Coverage", score: 0.78, weight: 2 },
  { label: "Clarity", score: 0.65, weight: 1 },
  { label: "Style", score: 0.41, weight: 1 },
];

describe("<RubricStrip>", () => {
  it("renders a bar per criterion summary names extremes", () => {
    const { container } = draw(<RubricStrip data={RUBRIC} width={120} height={32} />);
    // 4 tracks + 4 bars
    expect(container.querySelectorAll("rect").length).toBe(8);
    expect(rubricStripSummary(RUBRIC, EN_RUBRIC, fmt)).toBe(
      "4 criteria; highest Correctness (0.92), lowest Style (0.41).",
    );
  });

  it("target renders a target tick across all rows", () => {
    const { container } = draw(<RubricStrip data={RUBRIC} target={0.7} width={120} height={32} />);
    expect(container.querySelector("line[stroke-dasharray]")).not.toBeNull();
  });

  it("labels render the criterion names in the gutter", () => {
    const { container } = draw(<RubricStrip data={RUBRIC} width={120} height={56} />);
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toEqual(["Correctness", "Coverage", "Clarity", "Style"]);
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <RubricStrip data={RUBRIC} title="Model eval" width={120} height={32} />,
    );
    await expectNoA11yViolations(container);
  });

  describe("degenerate scores", () => {
    it("an unscored row can't be an extreme, but still counts as a criterion", () => {
      expect(
        rubricStripSummary(
          [{ label: "Correctness", score: null as unknown as number }, ...RUBRIC.slice(1)],
          EN_RUBRIC,
          fmt,
        ),
      ).toBe("4 criteria; highest Coverage (0.78), lowest Style (0.41).");
    });

    it("no scored row reads as no data, never as NaN or ∞", () => {
      const allGaps = RUBRIC.map((d) => ({ ...d, score: null as unknown as number }));
      expect(rubricStripSummary(allGaps, EN_RUBRIC, fmt)).toBe("No data.");
      expect(
        rubricStripSummary(
          RUBRIC.map((d) => ({ ...d, score: Number.POSITIVE_INFINITY })),
          EN_RUBRIC,
          fmt,
        ),
      ).toBe("No data.");
    });

    it("an unscored row draws its track but no bar — empty is not zero", () => {
      const { container } = draw(
        <RubricStrip
          data={[{ label: "Correctness", score: null as unknown as number }]}
          width={120}
          height={32}
        />,
      );
      const rects = [...container.querySelectorAll("rect")];
      // the track is full width; the bar is zero-width (drawn as absent)
      expect(rects[0]!.getAttribute("width")).not.toBe("0");
      expect(rects[1]!.getAttribute("width")).toBe("0");
    });
  });
});

// `score` is typed `number`, but a rubric row with no score is a real state and
// the runtime has to survive it. Both numeric fields are encoded — `score` is bar
// length, `weight` is row thickness — so the matrix runs once per field with the
// other finite.
//
// One suite per field, rather than the previous spelling that put the value on
// BOTH at once: with a degenerate weight the row can collapse before the score
// guard is consulted, so a broken score check reads as passing, and index parity
// decides which of NaN/±Infinity ever lands on which field. `labels` (default)
// and `target` are on — the criterion text and the target tick are where a
// numeral leak surfaces.
const rubricCase = (data: readonly RubricStripDatum[]) => (
  <RubricStrip data={data} target={0.7} title="Edge" />
);
mappedEdgeSuite(
  "RubricStrip (degenerate score)",
  (v, i) => ({ label: `c${i}`, score: v as number, weight: 1 + (i % 3) }),
  rubricCase,
);
mappedEdgeSuite(
  "RubricStrip (degenerate weight)",
  (v, i) => ({ label: `c${i}`, score: 0.35 + (i % 5) * 0.12, weight: v as number }),
  rubricCase,
);
