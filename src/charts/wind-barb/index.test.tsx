import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { WindBarb, windBarbSummary } from "./index.js";
import { EN_WIND_BARB } from "../../core/strings-wind-barb.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);

afterEach(() => vi.restoreAllMocks());

describe("<WindBarb>", () => {
  // `labelSize` raises the floor above the 11-unit cap, so it can ask for a
  // label taller than the box. The prop's contract is that such a label DROPS
  // rather than shrinking back under the floor; it used to paint at the
  // oversize font and spill out of the glyph into the page.
  it("drops an oversize label instead of painting it outside the box", () => {
    const { container } = draw(
      <WindBarb magnitude={32} direction={90} size={16} labelSize={20} label="value" />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.querySelector("text")).toBeNull();
    // …and the gutter drops with it, so the glyph reclaims the width.
    expect(svg.getAttribute("viewBox")).toBe("0 0 16 16");
  });

  it("renders a shaft summary names compass + degrees", () => {
    const { container } = draw(<WindBarb direction={225} magnitude={32} />);
    expect(container.querySelector('line[data-mc-ink="data"]')).not.toBeNull();
    expect(windBarbSummary(225, 32, 10, EN_WIND_BARB, fmt)).toBe("Southwest (225°), magnitude 32.");
  });

  it("calm → open circle + Calm. summary", () => {
    const { container } = draw(<WindBarb direction={90} magnitude={1} />);
    expect(container.querySelector("circle")).not.toBeNull();
    expect(container.querySelector("line")).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("Calm.");
  });

  it('label="value" renders the magnitude beside the glyph', () => {
    const { container } = draw(<WindBarb direction={45} magnitude={25} label="value" />);
    expect(container.querySelector("text")!.textContent).toBe("25");
  });

  it("negative magnitude flips direction 180° with a dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(windBarbSummary(45, -25, 10, EN_WIND_BARB, fmt)).toBe("Southwest (225°), magnitude 25.");
    draw(<WindBarb direction={45} magnitude={-25} />);
    expect(warn).toHaveBeenCalled();
  });

  it("arrow mode renders an arrowhead path", () => {
    const { container } = draw(<WindBarb direction={90} magnitude={25} mode="arrow" />);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<WindBarb direction={225} magnitude={32} title="Wind" />);
    await expectNoA11yViolations(container);
  });
});

valueEdgeSuite("WindBarb", (value: number) => (
  <WindBarb direction={90} magnitude={value} title="Edge" />
));
