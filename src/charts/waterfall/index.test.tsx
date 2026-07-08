import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Waterfall } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const PL = [
  { label: "Product", value: 300 },
  { label: "Services", value: 120 },
  { label: "Refunds", value: -140 },
  { label: "Upsells", value: 60 },
];

describe("<Waterfall> (plan/22 #20, S2-signed)", () => {
  it("floating bars + connectors + total; docs-as-tests summary", () => {
    const { container } = draw(<Waterfall data={PL} start={1200} />);
    expect(container.querySelectorAll("rect").length).toBe(5); // 4 steps + total
    expect(container.querySelectorAll("line").length).toBe(4);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "From 1,200 to 1,540 over 4 steps: +480 gains, −140 losses.",
    );
  });

  it("sign encoded by valence ink (redundant with direction)", () => {
    const { container } = draw(<Waterfall data={PL} />);
    expect(container.querySelectorAll('[data-mc-ink="positive"]').length).toBe(3);
    expect(container.querySelectorAll('[data-mc-ink="negative"]').length).toBe(1);
  });

  it("positive='down' flips the valence for cost breakdowns", () => {
    const { container } = draw(<Waterfall data={PL} positive="down" />);
    expect(container.querySelectorAll('[data-mc-ink="negative"]').length).toBe(3);
  });

  it("total={false} drops the grounded bar (the documented variant)", () => {
    const { container } = draw(<Waterfall data={PL} total={false} />);
    expect(container.querySelectorAll("rect").length).toBe(4);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Waterfall data={PL} start={1200} title="Monthly P&L" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("Waterfall", (data) => (
  <Waterfall data={data.map((v, i) => ({ label: `s${i}`, value: v }))} title="Edge" />
));
