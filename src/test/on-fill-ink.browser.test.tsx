// On-fill label ink — real browser + real stylesheet.
//
// `.mc-root text { fill: var(--mc-stroke) }` is a CSS declaration, so it
// outranks ANY SVG `fill` presentation attribute: a chart that tries to put
// on-fill ink on a label via `fill={...}` silently renders stroke ink instead
// (dark-on-dark on hot cells — invisible in jsdom, obvious in a product).
// The canon is the `data-mc-on-fill` marker + the styles.css rule; this suite
// pins that the rule actually wins, per chart that seats text on a solid mark.
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

// The load-bearing import: without the stylesheet the bug under test vanishes.
import "../../styles.css";

import { HeatCell } from "../charts/heat-cell/index.js";
import { TimeInRange } from "../charts/time-in-range/index.js";
import { EventTimeline } from "../charts/event-timeline/index.js";

const ON_FILL = "rgba(255, 255, 255, 0.96)";

/** Resolves the computed fill of the first on-fill-marked label. */
function onFillLabelFill(container: Element): string | null {
  const t = container.querySelector("text[data-mc-on-fill]");
  return t ? getComputedStyle(t).fill : null;
}

describe("on-fill label ink (real stylesheet)", () => {
  it("HeatCell upper-step value label takes --mc-on-fill, not stroke ink", async () => {
    const screen = await render(<HeatCell value={90} domain={[0, 100]} label="value" />);
    const fill = onFillLabelFill(screen.container);
    expect(fill, "upper-step label renders with the on-fill marker").not.toBeNull();
    expect(fill).toBe(ON_FILL);
  });

  it("HeatCell faint-step label keeps stroke ink (no marker)", async () => {
    const screen = await render(<HeatCell value={10} domain={[0, 100]} label="value" />);
    expect(screen.container.querySelector("text[data-mc-on-fill]")).toBeNull();
  });

  it("TimeInRange zone percent takes --mc-on-fill", async () => {
    const screen = await render(
      <TimeInRange data={{ below: 9, in: 72, above: 19 }} width={160} height={20} />,
    );
    expect(onFillLabelFill(screen.container)).toBe(ON_FILL);
  });

  it("EventTimeline span label takes --mc-on-fill", async () => {
    const screen = await render(
      <EventTimeline
        data={[{ start: 0, end: 100, label: "deploy" }]}
        label="spans"
        width={200}
        height={20}
      />,
    );
    expect(onFillLabelFill(screen.container)).toBe(ON_FILL);
  });
});
