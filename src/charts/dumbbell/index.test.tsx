import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Dumbbell } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<Dumbbell> (plan/22 #11, S2-paired)", () => {
  it("single row: connector + hollow from-dot + filled to-dot; docs-as-tests summary", () => {
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
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <Dumbbell data={[{ label: "Berlin", from: 48, to: 68 }]} title="Salary band moves" />,
    );
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("Dumbbell", (data) => (
  <Dumbbell
    data={data.map((v, i) => ({ label: `c${i}`, from: v ?? Number.NaN, to: (v ?? 0) * 1.2 }))}
    title="Edge"
  />
));
