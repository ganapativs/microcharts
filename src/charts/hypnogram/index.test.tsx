import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Hypnogram, hypnogramSummary } from "./index.js";
import { EN_HYPNOGRAM } from "../../core/strings-hypnogram.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const SLEEP = [
  { t: 0, state: "Awake" },
  { t: 10, state: "Light" },
  { t: 30, state: "Deep" },
  { t: 50, state: "Light" },
  { t: 60, state: "REM" },
  { t: 80, state: "Light" },
  { t: 90, state: "Awake" },
];

afterEach(() => vi.restoreAllMocks());

describe("<Hypnogram> (plan/25 §2, plan/17 F8)", () => {
  it("renders a step path; docs-as-tests summary", () => {
    const { container } = draw(<Hypnogram data={SLEEP} domain={[0, 110]} />);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
    expect(hypnogramSummary(SLEEP, ["Awake", "Light", "Deep", "REM"], [0, 110], EN_HYPNOGRAM)).toBe(
      "6 transitions across 4 states; longest run Light.",
    );
  });

  it("single state → flat summary, no transitions", () => {
    expect(hypnogramSummary([{ t: 0, state: "Awake" }], ["Awake"], [0, 10], EN_HYPNOGRAM)).toBe(
      "1 state, no transitions; Awake throughout.",
    );
  });

  it("lanes style renders one rect per run, no step path", () => {
    const { container } = draw(<Hypnogram data={SLEEP} domain={[0, 110]} variant="lanes" />);
    expect(container.querySelectorAll("rect").length).toBe(7);
    expect(container.querySelector('path[data-mc-ink="data"]')).toBeNull();
  });

  it("emphasis accents one state with a second path", () => {
    const { container } = draw(<Hypnogram data={SLEEP} domain={[0, 110]} emphasis="Deep" />);
    expect(container.querySelector('path[stroke="var(--mc-accent)"]')).not.toBeNull();
  });

  it("connectors={false} drops the transition strokes", () => {
    const off = draw(<Hypnogram data={SLEEP} domain={[0, 110]} connectors={false} />);
    const on = draw(<Hypnogram data={SLEEP} domain={[0, 110]} />);
    const offStrokes = off.container.querySelectorAll('path[stroke="var(--mc-neutral)"]').length;
    const onStrokes = on.container.querySelectorAll('path[stroke="var(--mc-neutral)"]').length;
    expect(onStrokes).toBeGreaterThan(offStrokes);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Hypnogram data={SLEEP} domain={[0, 110]} title="Sleep stages" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("Hypnogram", (data: readonly Value[]) => (
  // edge values go in the numeric `t` field (what geometry consumes); states are
  // stable labels so the leak check tests numbers, not deliberately-named states
  <Hypnogram
    data={data.map((v, i) => ({ t: v, state: ["Wake", "Light", "Deep"][i % 3]! }))}
    title="Edge"
  />
));
