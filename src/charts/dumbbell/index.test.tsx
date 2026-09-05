import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Dumbbell } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<Dumbbell>", () => {
  // The left guard bounded the from-value against the viewBox origin, not
  // against the row-name gutter. A `from` on the domain minimum clamps to the
  // plot edge, and the value was then seated one unit from the name it
  // overprinted — both anchored `end`, on the same y.
  it("drops the from-value rather than overprinting the row name", () => {
    const { container } = draw(
      <Dumbbell
        data={[{ label: "Berlin", from: 0, to: 30 }]}
        domain={[0, 50]}
        width={120}
        label="value"
      />,
    );
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toContain("Berlin");
    expect(texts).not.toContain("0");
  });

  it("single row: connector + hollow from-dot + filled to-dot summary", () => {
    const { container } = draw(<Dumbbell data={[{ from: 62000, to: 84000 }]} />);
    expect(container.querySelector("line")).not.toBeNull();
    const circles = [...container.querySelectorAll("circle")];
    expect(circles.length).toBe(2);
    expect(circles[0]!.getAttribute("fill")).toBe("none"); // hollow from
    expect(circles[1]!.getAttribute("data-mc-ink")).toBe("point"); // filled to
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "From 62,000 to 84,000, up 35%.",
    );
  });

  it("connector stops at the dot edges — never pierces the hollow from-dot", () => {
    const { container } = draw(
      <Dumbbell data={[{ from: 62000, to: 84000 }]} width={220} height={40} />,
    );
    const line = container.querySelector("line")!;
    const circles = [...container.querySelectorAll("circle")];
    const from = { cx: Number(circles[0]!.getAttribute("cx")), r: 1.7 };
    const x1 = Number(line.getAttribute("x1"));
    const x2 = Number(line.getAttribute("x2"));
    // the connector's near end sits at/beyond the hollow ring's edge, so the
    // visible chord inside the ring is ~0 (from-dot is left of the to-dot here)
    const nearEnd = Math.min(x1, x2);
    expect(nearEnd).toBeGreaterThanOrEqual(from.cx + from.r - 0.05);
  });

  it("from === to → single dot, no connector, 'No change at 62,000.'", () => {
    const { container } = draw(<Dumbbell data={[{ from: 62000, to: 62000 }]} />);
    expect(container.querySelector("line")).toBeNull();
    expect(container.querySelectorAll("circle").length).toBe(1);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No change at 62,000.");
  });

  it("multi-row leads with the largest change", () => {
    const { container } = draw(
      <Dumbbell
        data={[
          { label: "Paris", from: 50, to: 55 },
          { label: "Berlin", from: 48, to: 68 },
        ]}
      />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "2 rows. Largest change Berlin, up 42%.",
    );
  });

  it("positive colors the connector by direction; without it stays neutral", () => {
    const up = draw(<Dumbbell data={[{ from: 10, to: 20 }]} positive="up" />).container;
    expect(up.querySelector("line")!.getAttribute("data-mc-ink")).toBe("positive");
    const range = draw(<Dumbbell data={[{ from: 10, to: 20 }]} />).container;
    expect(range.querySelector("line")!.getAttribute("data-mc-ink")).toBe("muted");
  });

  it("label='value' renders from/to outside the dots when they fit", () => {
    const { container } = draw(
      <Dumbbell data={[{ from: 40, to: 60 }]} width={120} label="value" domain={[0, 100]} />,
    );
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toContain("40");
    expect(texts).toContain("60");
    // Every rendered figure takes the label ink role. A bare <text> keeps
    // `--mc-stroke` verbatim under `forced-color-adjust: none`, so in High
    // Contrast Mode it painted a fixed theme ink on the user's own background.
    for (const t of container.querySelectorAll("text")) {
      expect(t.getAttribute("data-mc-ink")).toBe("label");
    }
  });

  it("an unnamed leading row is described by its move, never by an empty name", () => {
    const { container } = draw(
      <Dumbbell
        data={[
          { from: 1, to: 2 },
          { from: 3, to: 9 },
        ]}
      />,
    );
    // `rows` has a slot for the name; "Largest change , up 200%." shipped the hole.
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "From 3 to 9, up 200%.",
    );
  });

  it("a box too narrow for the label gutter drops the names, not the containment", () => {
    const { container } = draw(
      <Dumbbell data={[{ label: "Minas Gerais", from: 1, to: 2 }]} width={20} height={12} />,
    );
    expect(container.querySelectorAll("text").length).toBe(0);
    // The 4-char floor once reserved a 37-unit gutter inside a 20-unit box and
    // pushed both dots past the right edge (`.mc-root` is overflow: visible).
    for (const c of container.querySelectorAll("circle")) {
      const cx = Number(c.getAttribute("cx"));
      const r = Number(c.getAttribute("r"));
      expect(cx - r).toBeGreaterThanOrEqual(0);
      expect(cx + r).toBeLessThanOrEqual(20);
    }
  });

  it('a row named "0" keeps its name (length, not truthiness)', () => {
    const { container } = draw(
      <Dumbbell
        data={[
          { label: "0", from: 50, to: 55 },
          { label: "1", from: 48, to: 68 },
        ]}
        width={220}
        height={40}
      />,
    );
    expect([...container.querySelectorAll("text")].map((t) => t.textContent)).toEqual(["0", "1"]);
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <Dumbbell data={[{ label: "Berlin", from: 48, to: 68 }]} title="Salary band moves" />,
    );
    await expectNoA11yViolations(container);
  });

  // Degradation contract: a label that no longer fits is DROPPED, never stacked
  // on its neighbour (the "Paris/Berlin/Rome in a tab header" bug) and never
  // painted outside the box. See tests/craft/floor.mjs.
  it("wide figure: row names use the gutter char budget, not a hard 6-char cap", () => {
    const { container } = draw(
      <Dumbbell
        data={[
          { label: "Minas Gerais", from: 1420, to: 980 },
          { label: "Espírito Santo", from: 1100, to: 900 },
        ]}
        width={640}
        height={220}
      />,
    );
    const labels = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(labels).toContain("Minas Gerais");
    expect(labels).toContain("Espírito Santo");
  });

  it("small box: row names drop rather than stacking, dots still render", () => {
    const rows = [
      { label: "East", from: 47, to: 1 },
      { label: "West", from: 41, to: 53 },
      { label: "South", from: 33, to: 43 },
      { label: "North", from: 44, to: 57 },
      { label: "Mid", from: 20, to: 26 },
    ];
    const big = draw(<Dumbbell data={rows} width={220} height={80} />).container;
    expect([...big.querySelectorAll("text")].map((t) => t.textContent)).toContain("South");

    // pitch = 28 / 5 = 5.6 viewBox units, under the 6-unit label line
    const small = draw(<Dumbbell data={rows} width={77} height={28} />).container;
    expect(small.querySelectorAll("text").length).toBe(0);
    // the paired dots — the actual encoding — survive
    expect(small.querySelectorAll("circle").length).toBeGreaterThanOrEqual(rows.length);
    // and the gutter went with the labels: the plot reclaims the full width
    const xs = [...small.querySelectorAll("circle")].map((c) => Number(c.getAttribute("cx")));
    expect(Math.min(...xs)).toBeLessThan(6);
  });
});

// Both endpoints are encoded, so the matrix runs once per endpoint. The previous
// spelling wrote `to: (v ?? 0) * 1.2`, which turned every missing endpoint into a
// measured zero — the opposite of "empty ≠ zero" — and, by deriving `to` from
// `from`, let the `okFrom` check discard the row before `okTo` was consulted, so
// a broken `to` guard would have read as passing. One suite per endpoint keeps
// the other finite and guarantees every matrix value reaches both fields.
// `label="value"` renders the formatted endpoints: that is where a numeral leak
// surfaces.
const dumbbellCase = (data: readonly { label: string; from: number; to: number }[]) => (
  <Dumbbell data={data} title="Edge" label="value" width={160} height={60} />
);
mappedEdgeSuite(
  "Dumbbell (degenerate from)",
  (v, i) => ({ label: `c${i}`, from: v as number, to: 10 + i * 5 }),
  dumbbellCase,
);
mappedEdgeSuite(
  "Dumbbell (degenerate to)",
  (v, i) => ({ label: `c${i}`, from: 10 + i * 5, to: v as number }),
  dumbbellCase,
);
