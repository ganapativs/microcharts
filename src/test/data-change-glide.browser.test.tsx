// Moment 3 — when the host sends new `data`, the marks that encode a value must
// TRAVEL to the new reading, and the marks that name a discrete unit must not.
//
// The whole rollout is one rule in `styles.css` keyed on `[data-mc-ink]`, which
// works only because of a house pattern: a focus or selection ring is drawn as a
// literal `stroke="var(--mc-accent)"` and carries no ink role. That pattern is
// not enforced anywhere else, so this file is what stops a chart from quietly
// inking its ring and lerping it across the plot — the defect
// `focus-ring-symmetry.browser.test.tsx` was written for, arriving by a
// different route.
//
// Two probes, because they fail differently:
//   1. `transitionProperty` proves the SELECTOR matched. Deterministic, no
//      timing, and it is the assertion that catches an inked ring.
//   2. `document.getAnimations()` proves a transition actually RAN on a data
//      change. Chrome only constructs a CSSTransition when a transitionable
//      property really changed, so its presence is proof and its absence is
//      proof of the opposite.
import { act, useState } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import "../../styles.css";

import { SparkBar } from "../charts/sparkbar/client.js";
import { DotPlot } from "../charts/dot-plot/client.js";

const BARS_A = [4, 9, 6, 12, 7, 10, 5];
const BARS_B = [11, 3, 13, 5, 12, 6, 9];

const DOTS_A = [
  { label: "Mon", value: 12 },
  { label: "Tue", value: 8 },
  { label: "Wed", value: 15 },
];
const DOTS_B = [
  { label: "Mon", value: 4 },
  { label: "Tue", value: 17 },
  { label: "Wed", value: 6 },
];

/** Published setter — lets a test change `data` without touching focus, so an
 * activated ring survives the update and can be probed mid-change. */
let push: ((next: never) => void) | null = null;

function Harness<T>({
  initial,
  render: renderChart,
}: {
  initial: T;
  render: (data: T) => React.ReactNode;
}): React.ReactNode {
  const [data, setData] = useState(initial);
  push = setData as unknown as (next: never) => void;
  return renderChart(data);
}

async function change<T>(next: T): Promise<void> {
  const set = push;
  if (!set) throw new Error("Harness never mounted");
  await act(async () => {
    set(next as never);
  });
}

/** Longhand `transition-property`, as the browser resolved it. */
function transitioned(el: Element): string[] {
  const value = getComputedStyle(el).transitionProperty;
  return value === "none" || value === "all" ? [value] : value.split(",").map((p) => p.trim());
}

/** Live CSSTransitions whose target is `el`, whatever the property. */
function liveTransitions(el: Element): Animation[] {
  return document.getAnimations().filter((a) => {
    const effect = a.effect;
    return effect instanceof KeyframeEffect && effect.target === el;
  });
}

describe("data change: value marks travel", () => {
  it("sparkbar bars declare geometry transitions and run one on a data change", async () => {
    await render(
      <Harness initial={BARS_A} render={(d) => <SparkBar data={d} width={140} height={28} />} />,
    );

    const bar = document.querySelector("[data-mc-host] .mc-root rect[data-mc-ink]");
    expect(bar, "sparkbar paints an inked rect").not.toBeNull();

    const props = transitioned(bar!);
    expect(props).toContain("height");
    expect(props).toContain("y");
    // One tempo across the catalog: fast enough that a feed ticking quicker than
    // the transition cannot leave the mark trailing its own data.
    expect(getComputedStyle(bar!).transitionDuration).toContain("0.2s");

    await change(BARS_B);
    expect(liveTransitions(bar!).length, "a data change starts a transition").toBeGreaterThan(0);
  });

  it("dot-plot dots travel, and the focus ring does not", async () => {
    await render(
      <Harness initial={DOTS_A} render={(d) => <DotPlot data={d} width={160} height={44} />} />,
    );

    const host = document.querySelector<HTMLElement>("[data-mc-host]");
    expect(host, "interactive wrapper carries the CSS hook").not.toBeNull();

    const dot = document.querySelector(".mc-root circle[data-mc-ink]");
    expect(transitioned(dot!)).toContain("cx");

    // Activate a unit so the overlay ring exists, then change the data WITHOUT
    // moving focus — the ring is still on screen for the whole transition.
    host!.focus();
    await userEvent.keyboard("{ArrowRight}");

    const ring = document.querySelector(".mc-root circle:not([data-mc-ink])");
    expect(ring, "roving focus paints an un-inked ring").not.toBeNull();

    const ringProps = transitioned(ring!);
    for (const geom of ["cx", "cy", "r", "x", "y", "width", "height"]) {
      expect(ringProps, `ring must snap, not lerp (${geom})`).not.toContain(geom);
    }

    await change(DOTS_B);
    expect(liveTransitions(dot!).length, "the dot travels").toBeGreaterThan(0);
    expect(liveTransitions(ring!).length, "the ring snaps").toBe(0);
  });
});

describe("data change: static entries never transition", () => {
  it("a chart with no interactive wrapper declares no geometry transition", async () => {
    const { SparkBar: StaticSparkBar } = await import("../charts/sparkbar/index.js");
    await render(<StaticSparkBar data={BARS_A} width={140} height={28} />);

    const hosts = document.querySelectorAll("[data-mc-host]");
    expect(hosts.length, "static entry emits no interactive wrapper").toBe(0);

    // `transition-property` initial value is `all`, so the property list proves
    // nothing on its own — the duration is what decides whether anything moves.
    const bar = document.querySelector(".mc-root rect[data-mc-ink]");
    expect(getComputedStyle(bar!).transitionDuration).toBe("0s");
  });
});
