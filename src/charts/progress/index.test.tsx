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

  it("node budget: no wrapper group per slot", () => {
    const { container } = draw(<Progress value={3} max={5} segments={5} label="none" />);
    expect(container.querySelectorAll("svg g").length).toBe(0);
    expect(container.querySelectorAll("svg *").length).toBe(8); // 5 tracks + 3 fills
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

// `segments` was read raw by the summary and again by the geometry, so the two
// could describe different tracks — the accessible name announced a stepped
// track nobody painted, or a step count nobody could count.
describe("<Progress> announces the track it paints", () => {
  it("a non-finite `segments` is the continuous bar, and says so", () => {
    for (const segments of [Number.POSITIVE_INFINITY, Number.NaN]) {
      const { container } = draw(<Progress value={0.68} segments={segments} />);
      expect(container.querySelectorAll('[data-mc-ink="band"]').length).toBe(1);
      expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("68% complete.");
    }
  });

  it("under two steps there is nothing to step between — value/max, not '0/1'", () => {
    const { container } = draw(<Progress value={0.68} segments={1.5} label="fraction" />);
    expect(container.querySelectorAll('[data-mc-ink="band"]').length).toBe(1);
    expect(container.querySelector("text")!.textContent).toBe("0.68/1");
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("68% complete.");
  });

  it("a saturated count announces the slots it drew, not the ones it was given", () => {
    const { container } = draw(
      <Progress value={0.68} segments={1e9} label="fraction" width={480} />,
    );
    const slots = container.querySelectorAll('[data-mc-ink="band"]').length;
    const done = container.querySelectorAll('[data-mc-ink="accent"]').length;
    expect(slots).toBe(200); // the drawn-slot ceiling in geometry.ts
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      `${done} of ${slots} steps.`,
    );
    expect(container.querySelector("text")!.textContent).toBe(`${done}/${slots}`);
  });

  it("steps done ride the bar, which clamps at both ends", () => {
    const over = draw(<Progress value={200} max={100} segments={5} label="fraction" />).container;
    expect(over.querySelectorAll('[data-mc-ink="accent"]').length).toBe(5);
    expect(over.querySelector("svg")!.getAttribute("aria-label")).toBe("5 of 5 steps.");
    expect(over.querySelector("text")!.textContent).toBe("5/5");

    const under = draw(<Progress value={-50} max={100} segments={5} label="fraction" />).container;
    expect(under.querySelectorAll('[data-mc-ink="accent"]').length).toBe(0);
    expect(under.querySelector("svg")!.getAttribute("aria-label")).toBe("0 of 5 steps.");
    expect(under.querySelector("text")!.textContent).toBe("0/5");
  });

  it("every slot keeps a positive width at the ceiling (a negative rect draws nothing)", () => {
    const { container } = draw(<Progress value={0.68} segments={1e9} label="none" />);
    for (const r of container.querySelectorAll("rect")) {
      expect(Number(r.getAttribute("width"))).toBeGreaterThan(0);
    }
  });
});

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
