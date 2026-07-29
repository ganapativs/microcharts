import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { CometTrail, cometTrailSummary } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const RISING = [40, 45, 50, 55, 60, 65, 70, 72, 75, 78, 80, 84, 87];

describe("<CometTrail>", () => {
  it("summary states the now-value and the recent trend", () => {
    const { container } = draw(<CometTrail data={RISING} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Now 87, rising over the last 12 updates.",
    );
  });

  it("falling / steady trend words", () => {
    expect(cometTrailSummary([9, 6, 3])).toBe("Now 3, falling over the last 2 updates.");
    expect(cometTrailSummary([5, 5, 5])).toBe("Now 5, steady over the last 2 updates.");
  });

  it("single point → 'Now {v}.'", () => {
    expect(cometTrailSummary([87])).toBe("Now 87.");
  });

  it("renders a trail + a head dot", () => {
    const { container } = draw(<CometTrail data={[1, 2, 3, 4]} />);
    expect(container.querySelectorAll('circle[data-mc-ink="point"]').length).toBe(3);
    expect(container.querySelector(".mc-comet-head")).not.toBeNull();
  });

  it('label="last" prints the now-value', () => {
    const { container } = draw(<CometTrail data={RISING} />);
    expect(container.querySelector('text[data-mc-ink="label"]')!.textContent).toBe("87");
  });

  it('label="none" drops the numeral', () => {
    const { container } = draw(<CometTrail data={RISING} label="none" />);
    expect(container.querySelector('text[data-mc-ink="label"]')).toBeNull();
  });

  it("empty → 'No data.'", () => {
    const { container } = draw(<CometTrail data={[]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("summary={false} hides it", () => {
    const { container } = draw(<CometTrail data={RISING} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<CometTrail data={RISING} title="Price" />);
    await expectNoA11yViolations(container);
  });

  // `.mc-root` is `overflow: visible`, so anything past the viewBox is a spill
  // into the page. The label gutter used to be a flat `fontSize * 3` — room for
  // about four digits — and `Now 9,876,543` painted ~25 units into whatever sat
  // to the right of the chart.
  describe("containment", () => {
    const num = (el: Element, a: string) => Number(el.getAttribute(a));

    const escapes = (container: HTMLElement): string[] => {
      const svg = container.querySelector("svg")!;
      const [, , w, h] = svg.getAttribute("viewBox")!.split(" ").map(Number) as number[];
      const out: string[] = [];
      for (const c of container.querySelectorAll("circle")) {
        const cx = num(c, "cx"),
          cy = num(c, "cy"),
          r = num(c, "r");
        if (cx - r < -0.01 || cx + r > w! + 0.01) out.push(`circle x ${cx}±${r} in ${w}`);
        if (cy - r < -0.01 || cy + r > h! + 0.01) out.push(`circle y ${cy}±${r} in ${h}`);
      }
      for (const t of container.querySelectorAll("text")) {
        const x = num(t, "x"),
          y = num(t, "y"),
          fs = num(t, "font-size");
        // The library's per-char over-estimate for tabular figures.
        const text = t.textContent ?? "";
        if (x < -0.01 || x + text.length * fs * 0.62 > w! + 0.01) out.push(`text x ${x} "${text}"`);
        if (y - fs * 0.5 < -0.01 || y + fs * 0.5 > h! + 0.01) out.push(`text y ${y} "${text}"`);
      }
      return out;
    };

    const BOXES: [string, () => React.ReactNode][] = [
      ["default", () => <CometTrail data={RISING} />],
      ["7-digit now-value", () => <CometTrail data={[1234567, 7654321, 9876543]} />],
      ["negative 7-digit", () => <CometTrail data={[-1234567.25, -7654321, -9876543.5]} />],
      ["single point", () => <CometTrail data={[9876543]} />],
      ["all-equal", () => <CometTrail data={[5, 5, 5, 5]} />],
      ["narrow", () => <CometTrail data={RISING} width={20} />],
      ["short", () => <CometTrail data={RISING} width={40} height={8} />],
      ["tall in a narrow box", () => <CometTrail data={RISING} height={200} />],
      ["wide", () => <CometTrail data={RISING} width={200} height={60} />],
      ["oversized fontSize", () => <CometTrail data={RISING} fontSize={40} />],
      ["label=none", () => <CometTrail data={RISING} width={12} label="none" />],
      ["capped trail", () => <CometTrail data={RISING} trail={100} />],
      ["no finite data", () => <CometTrail data={[NaN, Infinity, -Infinity]} />],
    ];

    for (const [name, ui] of BOXES) {
      it(`${name}: every mark and label sits inside the viewBox`, () => {
        expect(escapes(draw(ui()).container)).toEqual([]);
      });
    }

    it("drops the numeral it cannot seat — the summary still carries it", () => {
      const { container } = draw(<CometTrail data={[1234567, 7654321, 9876543]} />);
      expect(container.querySelector('text[data-mc-ink="label"]')).toBeNull();
      expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain("9,876,543");
      // Same figure, a box wide enough to hold it: the numeral comes back.
      const wide = draw(<CometTrail data={[1234567, 7654321, 9876543]} width={200} />);
      expect(wide.container.querySelector('text[data-mc-ink="label"]')!.textContent).toBe(
        "9,876,543",
      );
    });
  });

  // Hostile CONFIG: props a host computes rather than types. Each of these
  // rendered a normal-looking chart of `cx="NaN"` under a correct aria-label.
  describe("hostile config", () => {
    const coords = (container: HTMLElement) =>
      [...container.querySelectorAll("circle, text")].flatMap((el) =>
        ["cx", "cy", "r", "x", "y", "font-size"]
          .map((a) => el.getAttribute(a))
          .filter((v): v is string => v !== null),
      );

    it("fontSize=NaN falls back to the derived size", () => {
      const { container } = draw(<CometTrail data={RISING} fontSize={NaN} />);
      expect(coords(container).filter((v) => /NaN|Infinity/.test(v))).toEqual([]);
      expect(container.querySelector('text[data-mc-ink="label"]')!.textContent).toBe("87");
    });

    it("trail=NaN keeps the documented default window", () => {
      const { container } = draw(<CometTrail data={RISING} trail={NaN} />);
      expect(container.querySelectorAll('circle[data-mc-ink="point"]').length).toBe(12);
      expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
        "Now 87, rising over the last 12 updates.",
      );
    });

    it("a non-finite domain falls back to the data extent", () => {
      const { container } = draw(<CometTrail data={RISING} domain={[NaN, 100]} />);
      expect(coords(container).filter((v) => /NaN|Infinity/.test(v))).toEqual([]);
    });
  });
});
