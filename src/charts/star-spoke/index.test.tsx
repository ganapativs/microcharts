import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { StarSpoke, starSpokeSummary } from "./index.js";
import { EN_STAR_SPOKE } from "../../core/strings-star-spoke.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);

const PROFILE = [
  { label: "Speed", value: 0.9 },
  { label: "Power", value: 0.6 },
  { label: "Range", value: 0.5 },
  { label: "Cost", value: 0.3 },
  { label: "Ease", value: 0.7 },
];

afterEach(() => vi.restoreAllMocks());

describe("<StarSpoke> (plan/25 §9, plan/17 F11)", () => {
  it("renders a value spoke path + a guide path; docs-as-tests summary", () => {
    const { container } = draw(<StarSpoke data={PROFILE} />);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
    expect(starSpokeSummary(PROFILE, EN_STAR_SPOKE, fmt)).toBe(
      "5 metrics; highest Speed (0.9), lowest Cost (0.3).",
    );
  });

  it("never renders a closed contour polygon", () => {
    const { container } = draw(<StarSpoke data={PROFILE} />);
    const paths = [...container.querySelectorAll("path")].map((p) => p.getAttribute("d") || "");
    expect(paths.every((d) => !d.includes("Z"))).toBe(true);
  });

  it("dots render endpoint markers", () => {
    const { container } = draw(<StarSpoke data={PROFILE} dots size={64} />);
    expect(container.querySelector('path[style*="--mc-accent"]')).not.toBeNull();
  });

  it("compare draws a ghost baseline", () => {
    const { container } = draw(<StarSpoke data={PROFILE} compare={[0.5, 0.5, 0.5, 0.5, 0.5]} />);
    expect(container.querySelector('path[data-mc-ink="ghost"]')).not.toBeNull();
  });

  it("fewer than 3 metrics warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    draw(
      <StarSpoke
        data={[
          { label: "a", value: 0.5 },
          { label: "b", value: 0.8 },
        ]}
      />,
    );
    expect(warn).toHaveBeenCalled();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<StarSpoke data={PROFILE} title="Product profile" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("StarSpoke", (data: readonly Value[]) => (
  <StarSpoke
    data={data.map((v, i) => ({ label: `m${i}`, value: typeof v === "number" ? v : 0 }))}
    domain={[0, 1]}
    title="Edge"
  />
));
