import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { SpreadBand } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const ORG = [8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24];
const PAID = [12, 12, 13, 13, 13, 14, 14, 14, 15, 15, 16, 16];
const PAIRS = ORG.map((a, i) => ({ a, b: PAID[i]! }));

describe("<SpreadBand>", () => {
  it("signed bands + dashed reference behind a solid subject summary", () => {
    const { container } = draw(<SpreadBand data={PAIRS} labels={["Organic", "Paid"]} />);
    const paths = [...container.querySelectorAll("path")];
    // aLeadBand, bLeadBand, reference, subject
    expect(paths.length).toBe(4);
    expect(paths[2]!.getAttribute("stroke-dasharray")).toBe("4 2"); // reference behind
    expect(paths[3]!.getAttribute("stroke-dasharray")).toBeNull(); // subject on top
    expect(container.querySelectorAll('circle[data-mc-ink="point"]').length).toBe(1); // one crossing
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Organic leads Paid by 8; last crossed at point 5.",
    );
  });

  it("identical series → level, one line only", () => {
    const { container } = draw(<SpreadBand data={ORG.map((v) => ({ a: v, b: v }))} />);
    expect(container.querySelectorAll("path").length).toBe(1);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "The two series are level — no gap.",
    );
  });

  it("never crossing → one band, no crossing dots, 'never crossed'", () => {
    const { container } = draw(
      <SpreadBand
        data={[
          { a: 10, b: 5 },
          { a: 12, b: 6 },
          { a: 14, b: 7 },
        ]}
        labels={["A", "B"]}
      />,
    );
    expect(container.querySelectorAll('circle[data-mc-ink="point"]').length).toBe(0);
    expect(container.querySelectorAll("path").length).toBe(3); // aLead band + reference + subject
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "A leads B by 7; never crossed.",
    );
  });

  it("all-null → No data, nothing drawn", () => {
    const { container } = draw(
      <SpreadBand
        data={[
          { a: null, b: null },
          { a: null, b: null },
        ]}
      />,
    );
    expect(container.querySelectorAll("path").length).toBe(0);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <SpreadBand data={PAIRS} labels={["Organic", "Paid"]} title="Organic vs paid" />,
    );
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("SpreadBand", (data) => (
  <SpreadBand data={data.map((v) => ({ a: v, b: 3 }))} title="Edge" />
));
