import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ForecastCone } from "./index.js";
import type { ForecastInput } from "./geometry.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

afterEach(() => {
  vi.restoreAllMocks();
});

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const HIST = [30, 32, 31, 34, 36, 35, 38];
const FC: ForecastInput = {
  mid: [39, 40, 41, 42],
  p80: [
    [36, 42],
    [35, 45],
    [34, 50],
    [33, 55],
  ],
  p50: [
    [37, 41],
    [37, 43],
    [36, 46],
    [35, 49],
  ],
};

describe("<ForecastCone>", () => {
  it("summary states median, horizon interval, and today — the real string", () => {
    const { container } = draw(<ForecastCone data={HIST} forecast={FC} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Median forecast 42 by week 11 (80% between 33 and 55), from 38 today.",
    );
  });

  it("target adds a clearance clause (straddles when target is inside the band)", () => {
    const { container } = draw(<ForecastCone data={HIST} forecast={FC} target={45} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "The 80% band straddles the 45 target",
    );
  });

  it("target below the whole band → clears", () => {
    const { container } = draw(<ForecastCone data={HIST} forecast={FC} target={20} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "clears the 20 target",
    );
  });

  it("2 bands + solid history + dashed median", () => {
    const { container } = draw(<ForecastCone data={HIST} forecast={FC} />);
    expect(container.querySelectorAll("path.mc-cone-band").length).toBe(2);
    const mid = [...container.querySelectorAll("path")].find(
      (p) => p.getAttribute("stroke-dasharray") === "2.5 2.5",
    );
    expect(mid).toBeTruthy(); // median is dashed
  });

  it("p50 omitted → a single band", () => {
    const { container } = draw(
      <ForecastCone data={HIST} forecast={{ mid: FC.mid, p80: FC.p80 }} />,
    );
    expect(container.querySelectorAll("path.mc-cone-band").length).toBe(1);
  });

  it("a non-widening cone dev-warns and renders as given (never auto-inflated)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(
      <ForecastCone
        data={[10, 11]}
        forecast={{
          mid: [12, 13, 14],
          p80: [
            [9, 15],
            [10, 14],
            [11, 13],
          ],
        }}
      />,
    );
    expect(warn).toHaveBeenCalled();
    expect(container.querySelectorAll("path.mc-cone-band").length).toBe(1);
  });

  it("label='landing' states the median endpoint; 'none' shows no text", () => {
    const labeled = draw(<ForecastCone data={HIST} forecast={FC} />).container;
    const none = draw(<ForecastCone data={HIST} forecast={FC} label="none" />).container;
    expect(labeled.querySelector("text")!.textContent).toBe("42");
    expect(none.querySelector("text")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<ForecastCone data={HIST} forecast={FC} title="Q4 revenue" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("ForecastCone", (data) => (
  <ForecastCone
    data={data as number[]}
    forecast={{
      mid: [40, 42],
      p80: [
        [37, 43],
        [35, 47],
      ],
    }}
    title="Edge"
  />
));
