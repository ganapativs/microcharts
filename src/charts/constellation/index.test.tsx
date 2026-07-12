import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Constellation, constellationSummary } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const monthFmt = (x: number) => MONTHS[x] ?? String(x);

const EVENTS = [
  { x: 0, y: 40, m: 2 },
  { x: 2, y: 90, m: 7 },
  { x: 5, y: 30, m: 3 },
] as const;

describe("<Constellation>", () => {
  it("summary names the count, span, and largest event", () => {
    const { container } = draw(<Constellation data={EVENTS} xFormat={monthFmt} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "3 events between Jan and Jun; largest at Mar.",
    );
  });

  it("single event → the one-event phrasing", () => {
    expect(constellationSummary([{ x: 2, y: 5 }], { xFormat: monthFmt })).toBe("1 event at Mar.");
  });

  it("renders a connector path + one circle per event (+ the brightest-star halo)", () => {
    const { container } = draw(<Constellation data={EVENTS} />);
    expect(container.querySelectorAll("circle").length).toBe(4); // 3 events + 1 halo
    expect(container.querySelector('path[data-mc-ink="ghost"]')).not.toBeNull();
  });

  it("connect={false} drops the connector", () => {
    const { container } = draw(<Constellation data={EVENTS} connect={false} />);
    expect(container.querySelector("path")).toBeNull();
  });

  it('label="max" places a numeral at the largest event', () => {
    const { container } = draw(<Constellation data={EVENTS} label="max" />);
    const t = container.querySelector("text");
    expect(t).not.toBeNull();
    expect(t!.textContent).toBe("7"); // magnitude of the Mar event
  });

  it("empty data → 'No data.'", () => {
    const { container } = draw(<Constellation data={[]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<Constellation data={EVENTS} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <Constellation data={EVENTS} xFormat={monthFmt} title="Incidents" />,
    );
    await expectNoA11yViolations(container);
  });
});
