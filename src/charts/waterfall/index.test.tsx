import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Waterfall } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import { expectHostsAnnotations } from "../../test/annotation-host.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const PL = [
  { label: "Product", value: 300 },
  { label: "Services", value: 120 },
  { label: "Refunds", value: -140 },
  { label: "Upsells", value: 60 },
];

describe("<Waterfall>", () => {
  it("floating bars + connectors + total summary", () => {
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

  it('label="delta" draws signed value labels below the plot', () => {
    const { container } = draw(<Waterfall data={PL} start={1200} label="delta" width={260} />);
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts.length).toBeGreaterThan(0);
    expect(texts).toContain("+300");
    expect(texts).toContain("−140"); // U+2212 minus, never a hyphen
    // labels sit in a band below the plot → viewBox grows in height only
    const vb = container.querySelector("svg")!.getAttribute("viewBox")!.split(" ").map(Number);
    expect(vb[2]).toBe(260); // width unchanged
    expect(vb[3]).toBeGreaterThan(18); // height reserved a label band
    // containment: every label anchor stays inside the (grown) viewBox
    for (const t of container.querySelectorAll("text")) {
      expect(Number(t.getAttribute("x"))).toBeGreaterThanOrEqual(0);
      expect(Number(t.getAttribute("x"))).toBeLessThanOrEqual(vb[2]!);
      expect(Number(t.getAttribute("y"))).toBeLessThanOrEqual(vb[3]!);
    }
  });

  it('label defaults to "none" — no text, viewBox unchanged', () => {
    const { container } = draw(<Waterfall data={PL} width={260} height={18} />);
    expect(container.querySelectorAll("text").length).toBe(0);
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 260 18");
  });

  it("zero deltas carry no label (they are the 1-unit tick, not a move)", () => {
    const { container } = draw(
      <Waterfall
        data={[
          { label: "a", value: 100 },
          { label: "b", value: 0 },
        ]}
        label="delta"
        width={260}
        total={false}
      />,
    );
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toContain("+100");
    expect(texts).not.toContain("+0");
    expect(texts).not.toContain("0");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Waterfall data={PL} start={1200} title="Monthly P&L" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("Waterfall", (data) => (
  <Waterfall data={data.map((v, i) => ({ label: `s${i}`, value: v }))} title="Edge" />
));

describe("<Waterfall> annotations", () => {
  it("hosts annotations, clamped to the value plot (not the label band)", () => {
    expectHostsAnnotations(
      (children) => (
        <Waterfall data={PL} width={70} height={18} summary={false}>
          {children}
        </Waterfall>
      ),
      70,
      18,
    );
  });
});
