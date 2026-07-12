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
