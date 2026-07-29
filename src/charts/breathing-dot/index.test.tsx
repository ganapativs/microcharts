import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { BreathingDot, breathingDotSummary } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<BreathingDot>", () => {
  it("summary states the percent and the band word", () => {
    const { container } = draw(<BreathingDot value={0.42} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("Load 42% — calm.");
  });

  it("elevated / strained band words", () => {
    expect(breathingDotSummary(0.65)).toBe("Load 65% — elevated.");
    expect(breathingDotSummary(0.9)).toBe("Load 90% — strained.");
  });

  it("unknown value → 'Load unknown.'", () => {
    const { container } = draw(<BreathingDot value={null} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("Load unknown.");
  });

  it("core carries the band ink; ring present when known", () => {
    const { container } = draw(<BreathingDot value={0.9} />);
    expect(container.querySelector('.mc-breathing-core[data-mc-ink="negative"]')).not.toBeNull();
    expect(container.querySelectorAll("circle").length).toBe(2); // ring + core
  });

  it("unknown → gray core, no ring", () => {
    const { container } = draw(<BreathingDot value={null} />);
    // filled neutral (role), not "muted" (stroke-oriented) — the unknown core
    // is a solid gray dot, not an outline.
    expect(container.querySelector('.mc-breathing-core[data-mc-ink="neutral"]')).not.toBeNull();
    expect(container.querySelectorAll("circle").length).toBe(1);
  });

  it('label="value" prints the percent', () => {
    const { container } = draw(<BreathingDot value={0.42} label="value" />);
    expect(container.querySelector('text[data-mc-ink="label"]')!.textContent).toBe("42%");
  });

  it("summary={false} hides it", () => {
    const { container } = draw(<BreathingDot value={0.42} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<BreathingDot value={0.42} title="Load" />);
    await expectNoA11yViolations(container);
  });
});

/** Every numeric attribute, so "NaN" cannot hide in one of them. */
const numericAttrs = (container: HTMLElement): string[] => {
  const svg = container.querySelector("svg")!;
  const out = [svg.getAttribute("viewBox")!, svg.getAttribute("width")!];
  for (const el of container.querySelectorAll("circle, text"))
    for (const name of ["cx", "cy", "r", "x", "y", "font-size"]) {
      const v = el.getAttribute(name);
      if (v !== null) out.push(v);
    }
  return out;
};

describe("<BreathingDot> — hostile config", () => {
  it.each([
    ["size NaN", () => <BreathingDot value={0.6} size={NaN} label="value" />],
    ["size Infinity", () => <BreathingDot value={0.6} size={Infinity} />],
    ["size negative", () => <BreathingDot value={0.6} size={-20} />],
    ["fontSize NaN", () => <BreathingDot value={0.6} fontSize={NaN} label="value" />],
    ["fontSize Infinity", () => <BreathingDot value={0.6} fontSize={Infinity} label="value" />],
    ["fontSize negative", () => <BreathingDot value={0.6} fontSize={-8} label="value" />],
    ["thresholds NaN", () => <BreathingDot value={0.6} thresholds={[NaN, NaN]} label="value" />],
  ] as const)("%s never reaches the DOM", (_name, ui) => {
    const { container } = draw(ui());
    for (const v of numericAttrs(container)) expect(v).not.toMatch(/NaN|Infinity/);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).not.toMatch(/NaN|Infinity/);
  });

  it("NaN band edges announce and paint the default band, never 'strained'", () => {
    // NaN loses every comparison, so the old chart read 60% as strained/red.
    const { container } = draw(<BreathingDot value={0.6} thresholds={[NaN, NaN]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("Load 60% — elevated.");
    expect(container.querySelector('.mc-breathing-core[data-mc-ink="neutral"]')).not.toBeNull();
  });

  it("the spoken band and the painted band read the same edges", () => {
    const { container } = draw(<BreathingDot value={0.72} thresholds={[0.6, 0.85]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("Load 72% — elevated.");
    expect(container.querySelector('.mc-breathing-core[data-mc-ink="neutral"]')).not.toBeNull();
  });
});

// `.mc-root` is `overflow: visible` — anything past the viewBox paints on the
// page rather than clipping.
describe("<BreathingDot> — containment", () => {
  const ASCENT = 0.78;
  const DESCENT = 0.22;

  it.each([6, 8, 16, 28, 40])("size %i keeps marks and the numeral inside", (size) => {
    const { container } = draw(<BreathingDot value={0.92} label="value" size={size} />);
    const svg = container.querySelector("svg")!;
    const [w, h] = svg.getAttribute("viewBox")!.split(" ").slice(2).map(Number) as [number, number];

    for (const c of container.querySelectorAll("circle")) {
      const cx = Number(c.getAttribute("cx"));
      const cy = Number(c.getAttribute("cy"));
      const r = Number(c.getAttribute("r"));
      expect(r).toBeGreaterThan(0);
      expect(cx - r).toBeGreaterThanOrEqual(0);
      expect(cx + r).toBeLessThanOrEqual(w);
      expect(cy - r).toBeGreaterThanOrEqual(0);
      expect(cy + r).toBeLessThanOrEqual(h);
    }

    const text = container.querySelector("text");
    if (text) {
      const x = Number(text.getAttribute("x"));
      const y = Number(text.getAttribute("y"));
      const fs = Number(text.getAttribute("font-size"));
      // `textGutter`'s own per-char over-estimate — the reserved band must cover it.
      expect(x + Math.ceil(text.textContent!.length * fs * 0.62)).toBeLessThanOrEqual(w);
      expect(y - fs * ASCENT).toBeGreaterThanOrEqual(0);
      expect(y + fs * DESCENT).toBeLessThanOrEqual(h);
    }
  });

  it("drops the numeral rather than painting it outside a tiny box", () => {
    // `labelFont` floors at 7, so below ~8 units the em-box cannot fit. The
    // summary still states the percent.
    const { container } = draw(<BreathingDot value={0.92} label="value" size={6} />);
    expect(container.querySelector("text")).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 6 6");
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("Load 92% — strained.");
  });

  it("keeps the viewBox on integer coords", () => {
    const { container } = draw(<BreathingDot value={0.42} label="value" />);
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 40 16");
  });

  it("the label gutter is reserved while the value is unknown, so the line holds", () => {
    const known = draw(<BreathingDot value={0.42} label="value" />);
    const unknown = draw(<BreathingDot value={null} label="value" />);
    expect(unknown.container.querySelector("svg")!.getAttribute("width")).toBe(
      known.container.querySelector("svg")!.getAttribute("width"),
    );
  });
});
