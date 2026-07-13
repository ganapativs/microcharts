import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { OrbitStatus, orbitStatusSummary } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<OrbitStatus>", () => {
  it("summary states both variables with units", () => {
    const { container } = draw(
      <OrbitStatus latency={240} rate={12} latencyDomain={[0, 500]} rateDomain={[0, 20]} />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "240ms latency at 12 calls/s.",
    );
  });

  it("alert flags the summary", () => {
    expect(orbitStatusSummary(350, 12, { alert: 300 })).toBe(
      "350ms latency at 12 calls/s — above alert threshold.",
    );
  });

  it("unknown → 'Latency unknown.'", () => {
    expect(orbitStatusSummary(NaN, 12)).toBe("Latency unknown.");
  });

  it("renders center, orbit, and satellite", () => {
    const { container } = draw(<OrbitStatus latency={240} rate={12} />);
    expect(container.querySelectorAll("circle").length).toBe(3);
    expect(container.querySelector(".mc-orbit-satellite")).not.toBeNull();
  });

  it("unknown → gray, no satellite", () => {
    const { container } = draw(<OrbitStatus latency={NaN} rate={12} />);
    expect(container.querySelector(".mc-orbit-satellite")).toBeNull();
  });

  it('label="latency" prints the ms numeral', () => {
    const { container } = draw(<OrbitStatus latency={240} rate={12} label="latency" />);
    expect(container.querySelector('text[data-mc-ink="label"]')!.textContent).toBe("240ms");
  });

  it("summary={false} hides it", () => {
    const { container } = draw(<OrbitStatus latency={240} rate={12} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<OrbitStatus latency={240} rate={12} title="Payments API" />);
    await expectNoA11yViolations(container);
  });
});
