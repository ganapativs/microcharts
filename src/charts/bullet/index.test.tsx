import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Bullet } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<Bullet> (plan/05 S4, plan/08)", () => {
  it("renders measure bar + target tick, role=img", () => {
    const { container } = draw(<Bullet value={72} target={80} title="Sales" />);
    expect(container.querySelector("svg")!.getAttribute("role")).toBe("img");
    expect(container.querySelectorAll("rect").length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector("line")).not.toBeNull();
  });

  it("summary states value of target", () => {
    const { container } = draw(<Bullet value={72} target={80} />);
    expect(container.querySelector("desc")!.textContent).toBe("72 of 80 target.");
  });

  it("no target → value-only summary, no tick", () => {
    const { container } = draw(<Bullet value={72} />);
    expect(container.querySelector("desc")!.textContent).toBe("72.");
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
    expect(container.querySelector("desc")!.textContent).toBe("72% of 80% target.");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Bullet value={72} target={80} bands={[50, 80]} title="Sales" />);
    await expectNoA11yViolations(container);
  });
});
