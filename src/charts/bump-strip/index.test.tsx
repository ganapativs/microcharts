import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { BumpStrip } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const RANKS = [5, 5, 4, 3, 3, 2, 1, 2, 2, 3, 2, 2];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<BumpStrip>", () => {
  it("step line + change dots + '#' end labels summary", () => {
    const { container } = draw(<BumpStrip data={RANKS} />);
    expect(container.querySelector("path")).not.toBeNull();
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toContain("#5");
    expect(texts).toContain("#2");
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "From #5 to #2 over 12 weeks; best #1.",
    );
  });

  it("dots='changes' marks only rank moves", () => {
    const { container } = draw(<BumpStrip data={[3, 3, 2, 2]} />);
    expect(container.querySelectorAll("circle").length).toBe(1);
  });

  it("non-integer ranks round with a dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    draw(<BumpStrip data={[2.4, 3]} />);
    expect(warn).toHaveBeenCalled();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<BumpStrip data={RANKS} title="Chart position" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("BumpStrip", (data) => (
  <BumpStrip
    data={data.map((v) => (v === null ? null : Math.max(1, Math.round(Math.abs(v)))))}
    title="Edge"
  />
));
