import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Bullet } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<Bullet>", () => {
  it("renders measure bar + target tick, role=img", () => {
    const { container } = draw(<Bullet value={72} target={80} title="Sales" />);
    expect(container.querySelector("svg")!.getAttribute("role")).toBe("img");
    expect(container.querySelectorAll("rect").length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector("line")).not.toBeNull();
  });

  it("summary states value of target", () => {
    const { container } = draw(<Bullet value={72} target={80} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("72 of 80 target.");
  });

  it("no target → value-only summary, no tick", () => {
    const { container } = draw(<Bullet value={72} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("72.");
    expect(container.querySelector("line")).toBeNull();
  });

  it("bands render as region rects behind the measure", () => {
    const { container } = draw(
      <Bullet value={60} target={80} bands={[50, 80]} domain={[0, 100]} />,
    );
    // 3 band regions + 1 measure = 4 rects
    expect(container.querySelectorAll("rect")).toHaveLength(4);
  });

  it("format applies to the summary", () => {
    const { container } = draw(<Bullet value={0.72} target={0.8} format={{ style: "percent" }} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("72% of 80% target.");
  });

  it("a bands array past the spread limit renders instead of throwing", () => {
    const bands = Array.from({ length: 200_000 }, (_, i) => i / 2000);
    const { container } = draw(<Bullet value={50} target={80} bands={bands} />);
    // bounded band rects + the measure; the render used to die with RangeError
    expect(container.querySelectorAll("rect").length).toBeLessThanOrEqual(202);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("50 of 80 target.");
  });

  it("a sub-pad height emits no negative rect dimension", () => {
    const { container } = draw(<Bullet value={72} target={80} height={1} />);
    for (const r of container.querySelectorAll("rect")) {
      expect(Number(r.getAttribute("height"))).toBeGreaterThanOrEqual(0);
      expect(Number(r.getAttribute("width"))).toBeGreaterThanOrEqual(0);
    }
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Bullet value={72} target={80} bands={[50, 80]} title="Sales" />);
    await expectNoA11yViolations(container);
  });
});

valueEdgeSuite("Bullet", (value) => (
  <Bullet value={value} target={80} bands={[50, 90]} title="Edge" />
));
