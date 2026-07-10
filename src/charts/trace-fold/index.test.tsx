import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { TraceFold, traceFoldSummary } from "./index.js";
import { traceFoldGeometry } from "./geometry.js";
import { EN_TRACE_FOLD } from "../../core/strings-trace-fold.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const ms = (n: number) => `${Math.round(n)} ms`;
const TRACE = [
  { label: "request", start: 0, duration: 214, depth: 0 },
  { label: "db.query", start: 10, duration: 86, depth: 1, parent: 0 },
  { label: "auth", start: 0, duration: 8, depth: 1, parent: 0 },
  { label: "render", start: 96, duration: 60, depth: 1, parent: 0 },
  { label: "serialize", start: 156, duration: 40, depth: 1, parent: 0 },
  { label: "index-scan", start: 12, duration: 70, depth: 2, parent: 1 },
  { label: "decode", start: 82, duration: 12, depth: 2, parent: 1 },
  { label: "log", start: 200, duration: 14, depth: 1, parent: 0 },
  { label: "gc", start: 90, duration: 5, depth: 2, parent: 1 },
];

describe("<TraceFold> (plan/25 §18, plan/17 F17)", () => {
  it("renders a rect per span; docs-as-tests summary names the critical path", () => {
    const { container } = draw(<TraceFold data={TRACE} width={200} height={40} />);
    expect(container.querySelectorAll("rect").length).toBe(9);
    const geo = traceFoldGeometry({ data: TRACE, width: 200, height: 40, rowGap: 1.2 });
    expect(traceFoldSummary(geo, EN_TRACE_FOLD, ms)).toBe(
      "9 spans over 214 ms; longest db.query (86 ms) on the critical path.",
    );
  });

  it("critical spans are accented; non-critical muted (emphasis default)", () => {
    const { container } = draw(<TraceFold data={TRACE} width={200} height={40} />);
    expect(container.querySelector('rect[style*="--mc-accent"]')).not.toBeNull();
    expect(container.querySelector('rect[style*="--mc-neutral"]')).not.toBeNull();
  });

  it("emphasis='none' renders spans uniformly", () => {
    const { container } = draw(<TraceFold data={TRACE} emphasis="none" width={200} height={40} />);
    expect(container.querySelector('rect[style*="--mc-accent"]')).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <TraceFold data={TRACE} title="Request trace" width={200} height={40} />,
    );
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("TraceFold", (data: readonly Value[]) => (
  <TraceFold
    data={data.map((v, i) => ({
      label: `s${i}`,
      start: i * 5,
      duration: typeof v === "number" ? Math.abs(v) : 0,
      depth: i % 3,
    }))}
    title="Edge"
    width={120}
    height={32}
  />
));
