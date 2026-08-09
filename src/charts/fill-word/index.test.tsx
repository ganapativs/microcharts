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
    expect(container.querySelector("svg")!.getAttribute("style")).toContain("--mc-label-px");
  });

  // A host computes fontSize (`base * scale`, `Number("")` from a cleared
  // field). Every coordinate here descends from it, and the summary does not —
  // so the chart announced "62% complete." over `font-size="NaN"` and a NaN seat.
  it.each([NaN, Infinity, -Infinity, 0, -12])("a hostile fontSize (%s) paints no NaN", (fs) => {
    const { container } = draw(
      <FillWord word="uploading" value={0.62} fontSize={fs} label="value" />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.outerHTML).not.toMatch(/NaN|Infinity/);
    // …and it falls back to the documented default rather than to a blank box
    expect(svg.getAttribute("viewBox")).toBe(
      draw(<FillWord word="uploading" value={0.62} label="value" />)
        .container.querySelector("svg")!
        .getAttribute("viewBox"),
    );
    expect(svg.getAttribute("style")).toContain("--mc-label-px: 12px");
  });

  // `.mc-root` sets forced-color-adjust: none, so an inline fade would reach High
  // Contrast Mode verbatim; a presentation attribute loses to the stylesheet.
  it("the muted track word fades by attribute, not by inline style", () => {
    const { container } = draw(<FillWord word="quota" value={0.5} />);
    const track = container.querySelector('text[data-mc-ink="label"]')!;
    expect(track.getAttribute("fill-opacity")).toBe("0.4");
    expect(track.hasAttribute("data-mc-dim")).toBe(true);
    expect(track.getAttribute("style")).toBeNull();
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
