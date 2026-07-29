import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Slope } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";
import { expectHostsAnnotations } from "../../test/annotation-host.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const DATA = [
  { label: "East", from: 40, to: 47 },
  { label: "West", from: 55, to: 41 },
  { label: "South", from: 30, to: 33 },
  { label: "North", from: 50, to: 44 },
  { label: "Mid", from: 20, to: 35 },
];

describe("<Slope>", () => {
  it("one line + endpoint dots per category summary", () => {
    const { container } = draw(<Slope data={DATA} />);
    expect(container.querySelectorAll("line").length).toBe(5);
    expect(container.querySelectorAll("circle").length).toBe(10);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "5 categories: 3 up, 2 down. Largest change Mid, up 75%.",
    );
  });

  // Ink ROLES, not `stroke=` attributes: styles.css paints the roles, and a
  // stylesheet rule outranks an SVG presentation attribute. The attribute
  // spelling these assertions used to read passed while the browser painted
  // every line in `--mc-stroke` — valence, highlight and `color` all silently
  // lost on the connector while the dots obeyed them (see client.browser.test).
  it("neutral ink by default; positive engages direction tokens", () => {
    const plain = draw(<Slope data={DATA.slice(0, 2)} />).container;
    expect(plain.querySelector("line")!.getAttribute("data-mc-ink")).toBe("muted");
    expect(plain.querySelector("circle")!.getAttribute("data-mc-ink")).toBe("neutral");
    expect(plain.querySelector("line")!.getAttribute("stroke")).toBeNull();
    const valenced = draw(<Slope data={DATA.slice(0, 2)} positive="up" />).container;
    const inks = [...valenced.querySelectorAll("line")].map((l) => l.getAttribute("data-mc-ink"));
    expect(inks).toContain("positive");
    expect(inks).toContain("negative");
    // the dot at each end takes the row's role too, so line and endpoint agree
    expect(
      [...valenced.querySelectorAll("circle")].map((c) => c.getAttribute("data-mc-ink")),
    ).toEqual(["positive", "positive", "negative", "negative"]);
  });

  it("highlight → accent + heavier stroke", () => {
    const { container } = draw(<Slope data={DATA} highlight="West" />);
    const lines = [...container.querySelectorAll("line")];
    expect(lines[1]!.getAttribute("data-mc-ink")).toBe("accent");
    expect(lines[1]!.style.strokeWidth).toBe("calc(var(--mc-sw) * 1.5)");
  });

  it("color paints inline (the one declaration that must beat the role's rule)", () => {
    const { container } = draw(<Slope data={DATA.slice(0, 2)} color="#c0ffee" positive="up" />);
    const line = container.querySelector("line")!;
    expect(line.style.stroke).toBe("rgb(192, 255, 238)");
    expect(container.querySelector("circle")!.style.fill).toBe("rgb(192, 255, 238)");
    // …and highlight still outranks it
    const hl = draw(
      <Slope data={DATA.slice(0, 2)} color="#c0ffee" highlight={0} />,
    ).container.querySelector("line")!;
    expect(hl.getAttribute("data-mc-ink")).toBe("accent");
    expect(hl.style.stroke).toBe("");
  });

  it("every rendered label carries the label ink role", () => {
    // A right-column <text> holding a VALUE carried no role, so it painted the
    // `.mc-root text` default (`--mc-stroke`) opposite a left column in
    // `--mc-neutral`, and forced colors had nothing to map.
    const { container } = draw(<Slope data={DATA.slice(0, 2)} label="both" width={140} />);
    const texts = [...container.querySelectorAll("text")];
    expect(texts.length).toBeGreaterThan(0);
    expect(texts.every((t) => t.getAttribute("data-mc-ink") === "label")).toBe(true);
  });

  it("missing end → dashed stub (incomplete)", () => {
    const { container } = draw(<Slope data={[{ label: "a", from: Number.NaN, to: 5 }]} />);
    const stub = container.querySelector("line")!;
    expect(stub.getAttribute("stroke-dasharray")).not.toBeNull();
    expect(container.querySelectorAll("circle").length).toBe(1);
  });

  it("labels drop deterministically when rows are cramped", () => {
    const spacious = draw(<Slope data={DATA.slice(0, 2)} label="value" height={40} />).container;
    expect(spacious.querySelectorAll("text").length).toBeGreaterThan(0);
    const cramped = draw(<Slope data={DATA} label="value" height={24} />).container;
    expect(cramped.querySelectorAll("text").length).toBe(0);
  });

  it("the summary formats its numbers with `format`/`locale`", () => {
    const name = (ui: React.ReactNode) =>
      draw(ui).container.querySelector("svg")!.getAttribute("aria-label");
    // flat pair: the value went out as String(n), so a chart labelled "12.3K"
    // announced "12345.6".
    expect(
      name(
        <Slope
          data={[{ label: "a", from: 12345.6, to: 12345.6 }]}
          format={{ notation: "compact" }}
        />,
      ),
    ).toBe("No change at 12K.");
    // the ratio is a percent, and a percent is locale-shaped (de-DE: NBSP + %)
    expect(
      name(<Slope data={[...DATA, { label: "Far", from: 10, to: 40 }]} locale="de-DE" />),
    ).toBe("6 categories: 4 up, 2 down. Largest change Far, up 300 %.");
  });

  it("a single row is announced as a slope, not as a field of one", () => {
    const { container } = draw(<Slope data={[{ label: "East", from: 40, to: 47 }]} />);
    // was "1 categories: 1 up, 0 down. Largest change East, up 18%."
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "East: 40 to 47, up 18%.",
    );
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Slope data={DATA} title="Before vs after" />);
    await expectNoA11yViolations(container);
  });
});

// Both endpoints are encoded, so both take the degenerate value unlaundered.
// The previous spelling wrote `to: (v ?? 0) * 1.3`, which turned every missing
// end into a measured zero and kept NaN/±Infinity out of the right column
// entirely. `label="both"` renders the formatted endpoints, where the leaks are.
// One suite per endpoint keeps the other column finite, so each column's guard
// is exercised alone rather than short-circuited by its neighbour, and every
// matrix value reaches both `from` and `to`.
const slopeCase = (data: readonly { label: string; from: number; to: number }[]) => (
  <Slope data={data} label="both" title="Edge" width={120} height={60} />
);
mappedEdgeSuite(
  "Slope (degenerate from)",
  (v, i) => ({ label: `c${i}`, from: v as number, to: i }),
  slopeCase,
);
mappedEdgeSuite(
  "Slope (degenerate to)",
  (v, i) => ({ label: `c${i}`, from: i, to: v as number }),
  slopeCase,
);

describe("<Slope> annotations", () => {
  it("hosts annotations, clamped to the frame", () => {
    expectHostsAnnotations(
      (children) => (
        <Slope data={DATA} width={80} height={40} summary={false}>
          {children}
        </Slope>
      ),
      80,
      40,
    );
  });
});
