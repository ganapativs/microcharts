import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Horizon } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const SERIES = Array.from({ length: 90 }, (_, i) => Math.sin(i / 7) * 60 + i * 0.4 - 12);

describe("<Horizon> (plan/22 #25, S1)", () => {
  it("folded bands; summary reuses describeSeries (folding is presentation)", () => {
    const { container } = draw(<Horizon data={[3, 5, 4, 9, 7, 12, 15, 18, 17]} />);
    expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Trending up 467%. Range 3 to 18. Last value 17.",
    );
  });

  it("signed series → negative bands in the negative token", () => {
    const { container } = draw(<Horizon data={SERIES} />);
    const inks = [...container.querySelectorAll("path")].map((p) => p.getAttribute("data-mc-ink"));
    expect(inks).toContain("accent");
    expect(inks).toContain("negative");
  });

  it("custom color overrides the positive fill, negative stays the fixed token", () => {
    const { container } = draw(<Horizon data={SERIES} color="var(--custom-accent)" />);
    const paths = [...container.querySelectorAll("path")];
    const positive = paths.filter((p) => p.getAttribute("data-mc-ink") !== "negative");
    expect(positive.every((p) => (p as SVGElement).style.fill === "var(--custom-accent)")).toBe(
      true,
    );
    expect(container.querySelector('path[data-mc-ink="negative"]')).not.toBeNull();
  });

  it("same series renders identically across rows (no auto fold switching)", () => {
    const a = draw(<Horizon data={SERIES} summary={false} />).container.innerHTML;
    const b = draw(<Horizon data={SERIES} summary={false} />).container.innerHTML;
    expect(a).toBe(b);
  });

  it("node budget ≤ 7 (folds × sign)", () => {
    const { container } = draw(<Horizon data={SERIES} folds={3} />);
    expect(container.querySelectorAll("svg *").length).toBeLessThanOrEqual(7);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Horizon data={SERIES} title="Fleet load" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("Horizon", (data) => <Horizon data={data} title="Edge" />);
