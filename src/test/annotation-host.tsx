// Shared assertions for the annotation-host retrofit. A host must (1) actually
// draw annotation marks placed as children, and (2) keep every mark inside its
// viewBox even when a coordinate is wildly off-scale (the honesty clamp). Both
// checks are domain-agnostic — off-scale marks still emit their elements (at 0.4
// opacity), so the helper needs no knowledge of the chart's value range.
import type { ReactElement, ReactNode } from "react";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { expect } from "vitest";
import { Callout, Marker, TargetZone, Threshold } from "../shared/annotations.js";

const draw = (ui: ReactNode) => render(<StrictMode>{ui}</StrictMode>);

/**
 * Assert a chart hosts the annotation vocabulary.
 * @param host  builds the chart element with the given annotation children
 * @param width viewBox width  @param height viewBox height
 */
export function expectHostsAnnotations(
  host: (children: ReactNode) => ReactElement,
  width: number,
  height: number,
): void {
  // (1) marks are drawn — a band (TargetZone), a dashed hairline (Threshold),
  // and a labelled Marker.
  const drawn = draw(
    host(
      <>
        <TargetZone y={[1, 2]} />
        <Threshold y={1} label="T" />
        <Marker x={0} label="M" />
      </>,
    ),
  ).container;
  expect(drawn.querySelectorAll('[data-mc-ink="band"]').length).toBeGreaterThan(0);
  expect(drawn.querySelector('line[stroke-dasharray="2 2"]')).not.toBeNull();
  expect([...drawn.querySelectorAll("text")].map((t) => t.textContent)).toContain("M");

  // (2) containment — off-scale coords clamp to the frame, never escape it.
  const clamped = draw(
    host(
      <>
        <Threshold y={1e9} label="way off" />
        <Marker x={9999} label="off" />
        <Callout x={0} y={-1e9} label="dip" />
      </>,
    ),
  ).container;
  for (const el of clamped.querySelectorAll("line, rect, circle, text")) {
    for (const attr of ["x", "x1", "x2", "cx"]) {
      const v = el.getAttribute(attr);
      if (v !== null) expect(Number(v)).toBeLessThanOrEqual(width);
    }
    for (const attr of ["y", "y1", "y2", "cy"]) {
      const v = el.getAttribute(attr);
      if (v !== null) expect(Number(v)).toBeLessThanOrEqual(height);
    }
  }
}
