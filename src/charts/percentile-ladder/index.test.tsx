import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { PercentileLadder } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const SAMPLE = Array.from({ length: 101 }, (_, i) => i);

describe("<PercentileLadder>", () => {
  it("summary names the tail multiple — the docs' real string", () => {
    const { container } = draw(<PercentileLadder data={SAMPLE} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "p50 50, p90 90, p99 99 — the slowest 1% take 2× the median.",
    );
  });

  it("default marks p50/p90/p99 with the tail strongest", () => {
    const { container } = draw(<PercentileLadder data={SAMPLE} />);
    const flags = container.querySelectorAll('[data-mc-ink="flag"]');
    expect(flags.length).toBe(1); // only the tail tick is the accent flag
  });

  it("log scale renders an in-chart tag so the transform is never silent", () => {
    const { container } = draw(<PercentileLadder data={[1, 10, 100, 1000]} scale="log" />);
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toContain("log");
  });

  it("labels drop below the documented minimum width", () => {
    const wide = draw(<PercentileLadder data={SAMPLE} width={80} />).container;
    const narrow = draw(<PercentileLadder data={SAMPLE} width={40} />).container;
    expect(wide.querySelectorAll("text").length).toBeGreaterThan(0);
    expect(narrow.querySelectorAll("text").length).toBe(0);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<PercentileLadder data={SAMPLE} title="Latency percentiles" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("PercentileLadder", (data) => <PercentileLadder data={data} title="Edge" />);
