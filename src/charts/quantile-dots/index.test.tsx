import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { QuantileDots } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const UNIFORM = Array.from({ length: 20 }, (_, i) => i + 1); // 1..20

describe("<QuantileDots>", () => {
  it("threshold summary uses frequency framing — the real string", () => {
    const { container } = draw(<QuantileDots data={UNIFORM} threshold={15} side="above" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "5 in 20 chances above 15.",
    );
  });

  it("no threshold → range framing (never a bare percentage)", () => {
    const { container } = draw(<QuantileDots data={UNIFORM} />);
    const label = container.querySelector("svg")!.getAttribute("aria-label")!;
    expect(label).toContain("Most likely");
    expect(label).toContain("range");
  });

  it("side='below' counts the other side", () => {
    const { container } = draw(<QuantileDots data={UNIFORM} threshold={15} side="below" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "15 in 20 chances below 15.",
    );
  });

  it("renders `count` dots", () => {
    const { container } = draw(<QuantileDots data={UNIFORM} count={15} />);
    expect(container.querySelectorAll("circle").length).toBe(15);
  });

  it("all-equal → still exactly `count` dots (coincident dots must not collapse)", () => {
    // one column, and the radius floor overflows the stack — dots share
    // coordinates, so a coordinate-derived key would silently drop duplicates
    // and the render would undercount what the summary claims.
    const { container } = draw(<QuantileDots data={[7, 7, 7, 7, 7]} count={20} />);
    expect(container.querySelectorAll("circle").length).toBe(20);
  });

  it("past-threshold dots are re-inked (flag) AND ringed (never color-alone)", () => {
    const { container } = draw(<QuantileDots data={UNIFORM} threshold={15} side="above" />);
    const flags = container.querySelectorAll('circle[data-mc-ink="flag"]');
    expect(flags.length).toBe(5);
    // each flagged dot carries a stroke ring — the shape cue
    flags.forEach((c) => expect(c.getAttribute("stroke")).toBe("var(--mc-stroke)"));
  });

  it("label='count' states 'N in count' with a threshold; 'none' hides it", () => {
    const labeled = draw(<QuantileDots data={UNIFORM} threshold={15} />).container;
    const none = draw(<QuantileDots data={UNIFORM} threshold={15} label="none" />).container;
    expect(labeled.querySelector("text")!.textContent).toBe("5 in 20");
    expect(none.querySelector("text")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<QuantileDots data={UNIFORM} threshold={15} title="Bus wait" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("QuantileDots", (data) => <QuantileDots data={data as number[]} title="Edge" />);
