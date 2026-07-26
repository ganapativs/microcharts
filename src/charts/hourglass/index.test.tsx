import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Hourglass } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
// de-DE separates the number from the percent sign with U+00A0, which is
// indistinguishable from a plain space in source — named, never pasted.
const NBSP = String.fromCharCode(160);
const vbWidth = (c: Element) =>
  Number(c.querySelector("svg")!.getAttribute("viewBox")!.split(" ")[2]);

describe("<Hourglass>", () => {
  it("summary carries both sides", () => {
    const { container } = draw(<Hourglass value={0.75} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "75% elapsed, 25% remaining.",
    );
  });

  it("renders top sand, bottom sand, frame, and the running stream mid-run", () => {
    const { container } = draw(<Hourglass value={0.5} />);
    // glass-fill + top sand + bottom sand + glass-outline
    expect(container.querySelectorAll("path").length).toBe(4);
    // only the two sand paths carry the class the value cross-fade is scoped to
    expect(container.querySelectorAll("path.mc-hourglass-sand").length).toBe(2);
    expect(container.querySelectorAll("rect").length).toBe(2); // end-cap plates
    expect(container.querySelectorAll("line").length).toBe(1); // stream
  });

  it("value 0 → no bottom sand, no stream; value 1 → no top sand, no stream", () => {
    const zero = draw(<Hourglass value={0} />).container;
    expect(zero.querySelectorAll("line").length).toBe(0);
    const one = draw(<Hourglass value={1} />).container;
    expect(one.querySelectorAll("line").length).toBe(0);
  });

  it("stream={false} drops the running cue", () => {
    const { container } = draw(<Hourglass value={0.5} stream={false} />);
    expect(container.querySelector("line")).toBeNull();
  });

  it("label='remaining' prints the remaining percent", () => {
    const { container } = draw(<Hourglass value={0.75} label="remaining" />);
    expect(container.querySelector("text")!.textContent).toBe("25%");
  });

  it("label='elapsed' prints the elapsed percent", () => {
    const { container } = draw(<Hourglass value={0.75} label="elapsed" />);
    expect(container.querySelector("text")!.textContent).toBe("75%");
  });

  it("locale spells the percent, and the label gutter widens with the string", () => {
    const en = draw(<Hourglass value={0.75} label="elapsed" />).container;
    const de = draw(<Hourglass value={0.75} label="elapsed" locale="de-DE" />).container;
    expect(de.querySelector("text")!.textContent).toBe(`75${NBSP}%`);
    expect(de.querySelector("svg")!.getAttribute("aria-label")).toBe(
      `75${NBSP}% elapsed, 25${NBSP}% remaining.`,
    );
    // the gutter is reserved from the FORMATTED string, so the extra character
    // buys viewBox width instead of spilling the numeral past it
    expect(vbWidth(de)).toBeGreaterThan(vbWidth(en));
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<Hourglass value={0.5} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Hourglass value={0.75} title="Session" />);
    await expectNoA11yViolations(container);
  });
});
