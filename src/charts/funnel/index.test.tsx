import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Funnel } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const PIPE = [
  { label: "Visitors", value: 12400 },
  { label: "Signups", value: 5704 },
  { label: "Activated", value: 2730 },
  { label: "Paid", value: 1116 },
];

describe("<Funnel> (plan/22 #19, S3-sequential)", () => {
  it("stepped columns + slats; docs-as-tests summary", () => {
    const { container } = draw(<Funnel data={PIPE} />);
    expect(container.querySelectorAll("rect").length).toBe(4);
    expect(container.querySelectorAll("path").length).toBe(3);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "4 stages, 12,400 to 1,116 — overall 9%.",
    );
  });

  it("non-monotonic funnel renders truthfully + summary notes the inversion", () => {
    const { container } = draw(
      <Funnel
        data={[
          { label: "a", value: 100 },
          { label: "b", value: 40 },
          { label: "c", value: 60 },
        ]}
      />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "Stage 3 exceeds stage 2.",
    );
  });

  it("connectors={false} drops the slats", () => {
    const { container } = draw(<Funnel data={PIPE} connectors={false} />);
    expect(container.querySelectorAll("path").length).toBe(0);
  });

  it("highlight accents the leak stage", () => {
    const { container } = draw(<Funnel data={PIPE} highlight="Activated" />);
    const accent = [...container.querySelectorAll("rect")].filter(
      (r) => (r as SVGElement).style.fill === "var(--mc-accent)",
    );
    expect(accent.length).toBe(1);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Funnel data={PIPE} title="Signup funnel" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("Funnel", (data) => (
  <Funnel data={data.map((v, i) => ({ label: `s${i}`, value: v }))} title="Edge" />
));
