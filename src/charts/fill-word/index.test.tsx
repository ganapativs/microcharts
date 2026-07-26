import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { FillWord } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
// de-DE separates the number from the percent sign with U+00A0, which is
// indistinguishable from a plain space in source — named, never pasted.
const NBSP = String.fromCharCode(160);

describe("<FillWord>", () => {
  it("summary is the real string: '{word}: {pct} complete.'", () => {
    const { container } = draw(<FillWord word="uploading" value={0.62} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "uploading: 62% complete.",
    );
  });

  it("drain mode reports remaining", () => {
    const { container } = draw(<FillWord word="session" value={0.75} mode="drain" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "session: 25% remaining.",
    );
  });

  it("renders a muted base word + an accent copy clipped to the fraction", () => {
    const { container } = draw(<FillWord word="quota" value={0.5} />);
    const texts = container.querySelectorAll("text");
    expect(texts.length).toBe(2);
    const accent = container.querySelector('text[data-mc-ink="accent"]')!;
    expect(accent.getAttribute("style")).toContain("inset(0 50% 0 0)");
  });

  it("label='value' appends the percent numeral", () => {
    const { container } = draw(<FillWord word="storage" value={0.4} label="value" />);
    const texts = [...container.querySelectorAll("text")];
    expect(texts.length).toBe(3);
    expect(texts[2]!.textContent).toBe("40%");
  });

  it("locale spells the percent (de-DE puts a NBSP before the sign)", () => {
    const { container } = draw(
      <FillWord word="storage" value={0.4} label="value" locale="de-DE" />,
    );
    // painted numeral and generated summary read the SAME localized string
    expect([...container.querySelectorAll("text")][2]!.textContent).toBe(`40${NBSP}%`);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      `storage: 40${NBSP}% complete.`,
    );
  });

  it("empty word → nothing, 'No data.'", () => {
    const { container } = draw(<FillWord word="" value={0.5} />);
    expect(container.querySelector("text")).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("pins the label size inline (attribute alone is overridden by the base text rule)", () => {
    const { container } = draw(<FillWord word="sync" value={0.5} />);
    expect(container.querySelector("svg")!.getAttribute("style")).toContain("--mc-label-size");
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<FillWord word="sync" value={0.5} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<FillWord word="uploading" value={0.62} title="Upload" />);
    await expectNoA11yViolations(container);
  });
});
