import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { NetFlow } from "./index.js";
import type { NetFlowPeriod } from "./geometry.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const inAreaRole = (c: Element) => c.querySelectorAll("path")[0]!.getAttribute("data-mc-ink");
const SAMPLE: NetFlowPeriod[] = [
  { in: 4, out: 3 },
  { in: 5, out: 4 },
  { in: 6, out: 4 },
  { in: 5, out: 6 },
  { in: 7, out: 5 },
];

describe("<NetFlow>", () => {
  it("summary states signed net, gross, and net-positive count — the real string", () => {
    const { container } = draw(<NetFlow data={SAMPLE} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Net +2 last period; in 7 vs out 5; net positive 4 of 5 periods.",
    );
  });

  it("mirrored in/out areas + net line + zero baseline", () => {
    const { container } = draw(<NetFlow data={SAMPLE} />);
    expect(container.querySelectorAll("path").length).toBe(3); // in area, out area, net line
    expect(container.querySelectorAll("line").length).toBe(1); // zero baseline
    // areas are pos/neg valence ink-roles (direction survives forced-colors)
    expect(container.querySelector('path[data-mc-ink="positive"]')).not.toBeNull();
    expect(container.querySelector('path[data-mc-ink="negative"]')).not.toBeNull();
  });

  it("net={false} drops the line (gross flows only)", () => {
    const { container } = draw(<NetFlow data={SAMPLE} net={false} />);
    // only the two area paths remain
    expect(container.querySelectorAll("path").length).toBe(2);
  });

  it("positive='down' swaps the valence coloring (outflow is the goal)", () => {
    const up = draw(<NetFlow data={SAMPLE} />).container;
    const down = draw(<NetFlow data={SAMPLE} positive="down" />).container;
    // in-area is above the baseline in both; its ink-role flips pos↔neg
    expect(inAreaRole(up)).toBe("positive");
    expect(inAreaRole(down)).toBe("negative");
  });

  it("label='last' states the SIGNED net; 'none' shows no text", () => {
    const labeled = draw(<NetFlow data={SAMPLE} />).container;
    const none = draw(<NetFlow data={SAMPLE} label="none" />).container;
    expect(labeled.querySelector("text")!.textContent).toBe("+2");
    expect(none.querySelector("text")).toBeNull();
  });

  it("mode='bars' renders mirrored columns", () => {
    const { container } = draw(<NetFlow data={SAMPLE} mode="bars" />);
    // 5 in-bars + 5 out-bars (all non-zero here)
    expect(container.querySelectorAll("rect").length).toBe(10);
  });

  it("all-zero flow → baseline only, honest summary", () => {
    const { container } = draw(
      <NetFlow
        data={[
          { in: 0, out: 0 },
          { in: 0, out: 0 },
        ]}
      />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "No flow across 2 periods.",
    );
    expect(container.querySelectorAll("path").length).toBe(0);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<NetFlow data={SAMPLE} title="Cash flow" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("NetFlow", (data) => (
  <NetFlow data={data.map((v) => ({ in: v as number, out: (v as number) / 2 }))} title="Edge" />
));
