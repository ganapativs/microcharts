import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Progress } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<Progress>", () => {
  it("default: track + fill + percent label; summary is the docs' real string", () => {
    const { container } = draw(<Progress value={0.68} />);
    expect(container.querySelector('[data-mc-ink="band"]')).not.toBeNull();
    expect(container.querySelector('[data-mc-ink="accent"]')).not.toBeNull();
    expect(container.querySelector("text")!.textContent).toBe("68%");
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("68% complete.");
  });

  it("value > max → bar clamps at 100% but the label tells the truth", () => {
    const { container } = draw(<Progress value={112} max={100} />);
    const track = container.querySelector('[data-mc-ink="band"]')!;
    const fill = container.querySelector('[data-mc-ink="accent"]')!;
    expect(fill.getAttribute("width")).toBe(track.getAttribute("width"));
    expect(container.querySelector("text")!.textContent).toBe("112%");
  });

  it("max <= 0 → empty track + 'No data.'", () => {
    const { container } = draw(<Progress value={5} max={0} />);
    expect(container.querySelector('[data-mc-ink="accent"]')).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("segments: stepped semantics — '3 of 5 steps.' + fraction label", () => {
    const { container } = draw(<Progress value={3} max={5} segments={5} label="fraction" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("3 of 5 steps.");
    expect(container.querySelector("text")!.textContent).toBe("3/5");
    expect(container.querySelectorAll('[data-mc-ink="band"]').length).toBe(5);
    expect(container.querySelectorAll('[data-mc-ink="accent"]').length).toBe(3);
  });

  it("fractional value with segments → whole slots + one partial slot", () => {
    const { container } = draw(<Progress value={2.5} max={5} segments={5} label="none" />);
    const fills = [...container.querySelectorAll('[data-mc-ink="accent"]')];
    expect(fills.length).toBe(3);
    const widths = fills.map((f) => Number(f.getAttribute("width")));
    expect(widths[2]!).toBeCloseTo(widths[0]! / 2, 1);
  });

  it("positive='down' → burn-down wording, bar unchanged", () => {
    const { container } = draw(<Progress value={0.68} positive="down" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("32% remaining.");
    expect(container.querySelector("text")!.textContent).toBe("68%"); // bar + label stay factual
  });

  it("label modes: value / none", () => {
    const val = draw(<Progress value={34} max={50} label="value" />).container;
    expect(val.querySelector("text")!.textContent).toBe("34");
    const none = draw(<Progress value={0.5} label="none" />).container;
    expect(none.querySelector("text")).toBeNull();
  });

  it("label text stays inside the viewBox (containment)", () => {
    const { container } = draw(<Progress value={1.12} />);
    const svg = container.querySelector("svg")!;
    const text = container.querySelector("text")!;
    const [, , w] = svg.getAttribute("viewBox")!.split(" ").map(Number);
    const fontSize = Number(text.getAttribute("font-size"));
    expect(Number(text.getAttribute("x"))).toBeLessThanOrEqual(w!);
    expect(
      Number(text.getAttribute("x")) - text.textContent!.length * fontSize * 0.62,
    ).toBeGreaterThanOrEqual(0);
  });

  it("node budget: ≤ 4 continuous", () => {
    const { container } = draw(<Progress value={0.4} />);
    expect(container.querySelectorAll("svg *").length).toBeLessThanOrEqual(4);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Progress value={0.68} title="Onboarding" />);
    await expectNoA11yViolations(container);
  });
});

valueEdgeSuite("Progress", (value) => <Progress value={value} title="Edge" />);

describe("<Progress> degrades at small sizes", () => {
  // labelFont floors at 7; the percent sits on the track midline, so below one
  // em of box height its em-box crosses the viewBox edge and drops.
  it("keeps the percent while the box holds one em (height 7, font 7)", () => {
    const { container } = draw(<Progress value={0.44} width={80} height={7} />);
    expect(container.querySelector("text")!.textContent).toBe("44%");
  });

  it("drops the percent below one em — and the bar keeps its full length", () => {
    const { container } = draw(<Progress value={0.44} width={80} height={6} />);
    expect(container.querySelector("text")).toBeNull();
    expect(container.querySelector('[data-mc-ink="band"]')).not.toBeNull();
    const fill = container.querySelector('[data-mc-ink="accent"]')!;
    expect(Number(fill.getAttribute("width"))).toBeCloseTo(80 * 0.44, 1);
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 80 6");
  });

  it("the bar is byte-identical either side of the drop (no reflow)", () => {
    const rect = (h: number) =>
      draw(<Progress value={0.44} width={80} height={h} />)
        .container.querySelector('[data-mc-ink="accent"]')!
        .getAttribute("width");
    expect(rect(7)).toBe(rect(6));
  });
});
