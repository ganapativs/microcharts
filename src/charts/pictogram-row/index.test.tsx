import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { PictogramRow } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<PictogramRow>", () => {
  it("filled + hollow units; summary is the docs' real string", () => {
    const { container } = draw(<PictogramRow value={5} total={8} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("5 of 8.");
    // 5 filled discs + 3 hollow rings
    const filled = [...container.querySelectorAll("circle")].filter(
      (c) => c.getAttribute("fill") !== "none",
    );
    const hollow = [...container.querySelectorAll("circle")].filter(
      (c) => c.getAttribute("fill") === "none",
    );
    expect(filled.length).toBe(5);
    expect(hollow.length).toBe(3);
  });

  it("fractional value → true partial unit (clip default)", () => {
    const { container } = draw(<PictogramRow value={2.5} total={4} />);
    expect(container.querySelector("path")).not.toBeNull(); // the segment
  });

  it("fractional='round' has no partial", () => {
    const { container } = draw(<PictogramRow value={2.5} total={4} fractional="round" />);
    expect(container.querySelector("path")).toBeNull();
  });

  it("overflow → all filled + dev warning + true summary '9 of 8.'", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(<PictogramRow value={9} total={8} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("9 of 8.");
    expect(
      [...container.querySelectorAll("circle")].every((c) => c.getAttribute("fill") !== "none"),
    ).toBe(true);
    expect(warn).toHaveBeenCalled();
  });

  it("total <= 0 → 'No data.'", () => {
    const { container } = draw(<PictogramRow value={3} total={0} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("fractional total floors to whole units — 'No data.', not '0.25 of 0.'", () => {
    const { container } = draw(<PictogramRow value={0.25} total={0.5} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
    expect(container.querySelectorAll("circle")).toHaveLength(0);
  });

  it("a non-finite box falls back to the documented 60×12 — no NaN in the markup", () => {
    const { container } = draw(<PictogramRow value={3} total={5} width={NaN} height={Infinity} />);
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 60 12");
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it("a dense row still paints — a negative radius is an SVG error, not a small dot", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(<PictogramRow value={10} total={60} />);
    const rs = [...container.querySelectorAll("circle")].map((c) => Number(c.getAttribute("r")));
    expect(rs).toHaveLength(60);
    expect(rs.every((r) => r >= 0)).toBe(true);
    expect(rs.filter((r) => r > 0).length).toBeGreaterThan(0);
    expect(warn).toHaveBeenCalled();
  });

  it("square coords stay 2-dp — deriving them from cx/r reintroduced float noise", () => {
    const { container } = draw(<PictogramRow value={2} total={5} shape="square" />);
    for (const rect of container.querySelectorAll("rect")) {
      for (const attr of ["x", "y", "width", "height"]) {
        expect(rect.getAttribute(attr)!).toMatch(/^-?\d+(\.\d{1,2})?$/);
      }
    }
  });

  it("negative value → all empty, true summary", () => {
    const { container } = draw(<PictogramRow value={-2} total={4} />);
    expect(
      [...container.querySelectorAll("circle")].every((c) => c.getAttribute("fill") === "none"),
    ).toBe(true);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("-2 of 4.");
  });

  it("square shape renders rects", () => {
    const { container } = draw(<PictogramRow value={2} total={3} shape="square" />);
    expect(container.querySelectorAll("rect").length).toBeGreaterThan(0);
  });

  it("renderPoint escape hatch replaces the unit glyph", () => {
    const { container } = draw(
      <PictogramRow
        value={2}
        total={3}
        renderPoint={(u) => (
          <text key={u.index} x={u.cx} y={u.cy} fontSize={u.r * 2}>
            ★
          </text>
        )}
      />,
    );
    expect(container.querySelectorAll("text").length).toBe(3);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<PictogramRow value={5} total={8} title="Committee seats" />);
    await expectNoA11yViolations(container);
  });
});

valueEdgeSuite("PictogramRow", (value) => <PictogramRow value={value} total={8} title="Edge" />);
