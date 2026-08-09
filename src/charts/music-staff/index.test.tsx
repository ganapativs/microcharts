import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { MusicStaff } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const MELODY = [3, 5, 4, 8, 6, 9];

describe("<MusicStaff>", () => {
  it("summary reuses describeSeries verbatim", () => {
    const { container } = draw(<MusicStaff data={MELODY} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Trending up 200%. Range 3 to 9. Last value 9.",
    );
  });

  it("renders the staff + one note per finite value", () => {
    const { container } = draw(<MusicStaff data={MELODY} />);
    // staff path (1) + no ledger for a mid-range melody at these positions
    expect(container.querySelectorAll('path[data-mc-ink="muted"]').length).toBeGreaterThanOrEqual(
      1,
    );
    expect(container.querySelectorAll("ellipse").length).toBe(6);
  });

  it("null values are rests (no note)", () => {
    const { container } = draw(<MusicStaff data={[3, null, 9]} />);
    expect(container.querySelectorAll("ellipse").length).toBe(2);
  });

  it("label='last' prints the final value", () => {
    const { container } = draw(<MusicStaff data={MELODY} label="last" />);
    expect(container.querySelector("text")!.textContent).toBe("9");
  });

  it("the current pitch takes the accent ROLE, not an inline fill", () => {
    // Inline paint survives `forced-color-adjust: none` verbatim, so an inline
    // `var(--mc-accent)` kept a brand hex in High Contrast Mode while every
    // other note mapped to CanvasText.
    const { container } = draw(<MusicStaff data={MELODY} />);
    const notes = [...container.querySelectorAll("ellipse")];
    expect(notes.map((n) => n.getAttribute("data-mc-ink"))).toEqual([
      "point",
      "point",
      "point",
      "point",
      "point",
      "accent",
    ]);
    expect(notes.some((n) => n.getAttribute("style")?.includes("--mc-accent"))).toBe(false);
  });

  it("the contour takes the ghost role; `color` still overrides it", () => {
    const { container } = draw(<MusicStaff data={MELODY} />);
    const contour = container.querySelector('path[data-mc-w="tick"]')!;
    expect(contour.getAttribute("data-mc-ink")).toBe("ghost");
    expect(contour.getAttribute("fill")).toBe("none"); // never a filled wedge
    expect(contour.getAttribute("style")).not.toMatch(/stroke:/);

    const painted = draw(<MusicStaff data={MELODY} color="#c00" />);
    expect(
      painted.container.querySelector('path[data-mc-w="tick"]')!.getAttribute("style"),
    ).toMatch(/stroke: rgb\(204, 0, 0\)/);
  });

  it("staff + ledger opacity is an attribute, so a stylesheet can still lift it", () => {
    const { container } = draw(<MusicStaff data={[0, 100]} />);
    const rules = [...container.querySelectorAll('path[data-mc-ink="muted"]')];
    expect(rules.length).toBe(2);
    for (const p of rules) {
      expect(p.getAttribute("stroke-opacity")).not.toBeNull();
      expect(p.getAttribute("style")).toBeNull();
    }
  });

  it("a non-finite box or fontSize never reaches a coordinate", () => {
    // `Chart` clamps the FRAME; a chart that read the raw prop still drew its
    // marks against it (`cy="NaN"`, `--mc-label-px: NaNpx`).
    for (const bad of [NaN, Infinity, 0, -50]) {
      for (const html of [
        draw(<MusicStaff data={MELODY} width={bad} label="last" />).container.innerHTML,
        draw(<MusicStaff data={MELODY} height={bad} label="last" />).container.innerHTML,
        draw(<MusicStaff data={MELODY} fontSize={bad} label="last" />).container.innerHTML,
      ]) {
        expect(html).not.toMatch(/NaN|Infinity/);
      }
    }
  });

  it("a figure too long for the box drops instead of pushing the staff out of it", () => {
    // 12 characters wanted 84 units of a 60-unit box: the staff ran to x -26 and
    // both notes collapsed onto one x, losing the time axis.
    const { container } = draw(<MusicStaff data={[1, -999999999]} label="last" />);
    expect(container.querySelector("text")).toBeNull();
    const notes = [...container.querySelectorAll("ellipse")];
    expect(new Set(notes.map((n) => n.getAttribute("cx"))).size).toBe(2);
    for (const d of [...container.querySelectorAll("path")].map((p) => p.getAttribute("d")!)) {
      for (const [, x] of d.matchAll(/[ML](-?[\d.]+) /g)) {
        expect(Number(x)).toBeGreaterThanOrEqual(0);
        expect(Number(x)).toBeLessThanOrEqual(60);
      }
    }
    // the summary still carries the value the label gave up on
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "Last value -999,999,999.",
    );
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<MusicStaff data={MELODY} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<MusicStaff data={MELODY} title="Sprint melody" />);
    await expectNoA11yViolations(container);
  });
});
