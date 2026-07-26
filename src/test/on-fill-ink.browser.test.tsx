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
import { PartitionStrip } from "../charts/partition-strip/index.js";

/**
 * The on-fill inks, RESOLVED THROUGH THE CASCADE rather than pasted in.
 *
 * This file used to hardcode `rgba(255, 255, 255, 0.96)`, which made it blind to
 * the defect it exists to guard: `--mc-on-fill` had no dark twin, and the rule
 * for the dense strips spelled that same literal out instead of reading the
 * token, so neither the token nor the rule could follow the theme. A test that
 * repeats the value cannot notice the value being wrong.
 */
function token(name: string): string {
  const probe = document.createElement("span");
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
}

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
    expect(fill).toBe(token("--mc-on-fill"));
  });

  it("HeatCell faint-step label keeps stroke ink (no marker)", async () => {
    const screen = await render(<HeatCell value={10} domain={[0, 100]} label="value" />);
    expect(screen.container.querySelector("text[data-mc-on-fill]")).toBeNull();
  });

  it("TimeInRange zone percent takes --mc-on-fill", async () => {
    const screen = await render(
      <TimeInRange data={{ below: 9, in: 72, above: 19 }} width={160} height={20} />,
    );
    expect(onFillLabelFill(screen.container)).toBe(token("--mc-on-fill"));
  });

  it("in DARK mode the on-fill ink flips with the theme", async () => {
    // The case that catches a rule spelling the value out: in light mode the
    // literal and the token resolve to the same colour, so only the dark twin
    // distinguishes them. The dark palette is deliberately LIFTED, which is why
    // the twin exists — white-on-accent measures 2.7:1 there.
    const screen = await render(
      <div data-mc-theme="dark">
        <HeatCell value={90} domain={[0, 100]} label="value" />
      </div>,
    );
    const scope = screen.container.querySelector("[data-mc-theme='dark']")!;
    const dark = getComputedStyle(scope).getPropertyValue("--mc-on-fill").trim();
    expect(dark, "--mc-on-fill has no dark twin").not.toBe("");
    // A probe OUTSIDE the dark scope resolves the light value; the two must differ
    // or this assertion is vacuous.
    expect(dark).not.toBe(token("--mc-on-fill"));
    expect(onFillLabelFill(screen.container)).toBe(
      (() => {
        const probe = document.createElement("span");
        probe.style.color = `var(--mc-on-fill)`;
        scope.append(probe);
        const c = getComputedStyle(probe).color;
        probe.remove();
        return c;
      })(),
    );
  });

  it("PartitionStrip label takes the CATEGORICAL ink, not the on-fill ink", async () => {
    // These labels sit on a mid-tone cat fill, where the light on-fill ink reads
    // 2.1-3.7:1. The arithmetic is guarded in theming-contract.test.ts; this
    // pins that the RULE reaches the element — `.mc-partition text` has to win
    // over the `.mc-trace, .mc-partition text` rule above it, which is source
    // order between two zero-specificity selectors.
    const screen = await render(
      <PartitionStrip
        data={[
          { label: "one", value: 60 },
          { label: "two", value: 40 },
        ]}
        width={200}
        height={24}
      />,
    );
    const label = screen.container.querySelector(".mc-partition text");
    expect(label, "PartitionStrip renders a segment label at this size").not.toBeNull();
    expect(getComputedStyle(label!).fill).toBe(token("--mc-on-cat"));
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
    expect(onFillLabelFill(screen.container)).toBe(token("--mc-on-fill"));
  });
});
