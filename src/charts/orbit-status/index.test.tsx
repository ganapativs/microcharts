import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { OrbitStatus, orbitStatusSummary } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<OrbitStatus>", () => {
  it("summary states both variables with units", () => {
    const { container } = draw(
      <OrbitStatus latency={240} rate={12} latencyDomain={[0, 500]} rateDomain={[0, 20]} />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "240ms latency at 12 calls/s.",
    );
  });

  it("threshold flags the summary", () => {
    expect(orbitStatusSummary(350, 12, { threshold: 300 })).toBe(
      "350ms latency at 12 calls/s — above alert threshold.",
    );
  });

  it("unknown → 'Latency unknown.'", () => {
    expect(orbitStatusSummary(NaN, 12)).toBe("Latency unknown.");
  });

  it("renders center, orbit, and satellite", () => {
    const { container } = draw(<OrbitStatus latency={240} rate={12} />);
    expect(container.querySelectorAll("circle").length).toBe(3);
    expect(container.querySelector(".mc-orbit-satellite")).not.toBeNull();
  });

  it("unknown → gray, no satellite", () => {
    const { container } = draw(<OrbitStatus latency={NaN} rate={12} />);
    expect(container.querySelector(".mc-orbit-satellite")).toBeNull();
  });

  it('label="latency" prints the ms numeral', () => {
    const { container } = draw(<OrbitStatus latency={240} rate={12} label="latency" />);
    expect(container.querySelector('text[data-mc-ink="label"]')!.textContent).toBe("240ms");
  });

  it("`domain` is the grammar-standard spelling of the latency extent", () => {
    const orbitR = (ui: React.ReactNode) =>
      draw(ui).container.querySelectorAll("circle")[0]!.getAttribute("r");
    expect(orbitR(<OrbitStatus latency={240} rate={12} domain={[0, 500]} />)).toBe(
      orbitR(<OrbitStatus latency={240} rate={12} latencyDomain={[0, 500]} />),
    );
    // …and it is a real scale change, not an ignored prop.
    expect(orbitR(<OrbitStatus latency={240} rate={12} domain={[0, 500]} />)).not.toBe(
      orbitR(<OrbitStatus latency={240} rate={12} />),
    );
  });

  it("summary={false} hides it", () => {
    const { container } = draw(<OrbitStatus latency={240} rate={12} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<OrbitStatus latency={240} rate={12} title="Payments API" />);
    await expectNoA11yViolations(container);
  });

  it("`color` leaves an alerted satellite its valence", () => {
    const calm = draw(<OrbitStatus latency={200} rate={12} threshold={300} color="#4169e1" />);
    expect(
      (calm.container.querySelector(".mc-orbit-satellite") as SVGCircleElement).style.fill,
    ).not.toBe("");
    const hot = draw(<OrbitStatus latency={350} rate={12} threshold={300} color="#4169e1" />);
    const sat = hot.container.querySelector(".mc-orbit-satellite")!;
    expect(sat.getAttribute("data-mc-ink")).toBe("negative");
    expect(sat.getAttribute("style")).toBeNull();
  });
});

/** Every numeric attribute, so "NaN" cannot hide in one of them. */
const numericAttrs = (container: HTMLElement): string[] => {
  const svg = container.querySelector("svg")!;
  const out = [svg.getAttribute("viewBox")!, svg.getAttribute("width")!];
  for (const el of container.querySelectorAll("circle, text"))
    for (const name of ["cx", "cy", "r", "x", "y", "font-size"]) {
      const v = el.getAttribute(name);
      if (v !== null) out.push(v);
    }
  return out;
};

describe("<OrbitStatus> — hostile config", () => {
  it.each([
    ["size NaN", () => <OrbitStatus latency={240} rate={12} size={NaN} label="latency" />],
    ["size Infinity", () => <OrbitStatus latency={240} rate={12} size={Infinity} />],
    ["size negative", () => <OrbitStatus latency={240} rate={12} size={-20} />],
    ["fontSize NaN", () => <OrbitStatus latency={240} rate={12} fontSize={NaN} label="latency" />],
    [
      "fontSize Infinity",
      () => <OrbitStatus latency={240} rate={12} fontSize={Infinity} label="latency" />,
    ],
    [
      "fontSize negative",
      () => <OrbitStatus latency={240} rate={12} fontSize={-8} label="latency" />,
    ],
    ["threshold NaN", () => <OrbitStatus latency={240} rate={12} threshold={NaN} />],
    ["latencyDomain NaN", () => <OrbitStatus latency={240} rate={12} latencyDomain={[NaN, 500]} />],
    ["rateDomain NaN", () => <OrbitStatus latency={240} rate={12} rateDomain={[0, NaN]} />],
  ] as const)("%s never reaches the DOM", (_name, ui) => {
    const { container } = draw(ui());
    for (const v of numericAttrs(container)) expect(v).not.toMatch(/NaN|Infinity/);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).not.toMatch(/NaN|Infinity/);
  });

  it("a non-finite `size` paints the documented default box, not an empty one", () => {
    // The frame was clamped to 1×1 while the marks were laid out against the
    // raw prop, so the chart announced a latency it had painted nowhere.
    const { container } = draw(<OrbitStatus latency={240} rate={12} size={NaN} />);
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 20 20");
    expect(container.querySelector(".mc-orbit-satellite")!.getAttribute("cx")).toBe("10");
  });
});

// `.mc-root` is `overflow: visible` — anything past the viewBox paints on the
// page rather than clipping.
describe("<OrbitStatus> — containment", () => {
  const ASCENT = 0.78;
  const DESCENT = 0.22;

  it.each([8, 12, 20, 28, 40, 64])("size %i keeps marks and the numeral inside", (size) => {
    // Latency at the top of the domain and the threshold tripped: the widest
    // orbit the chart can draw, carrying the largest satellite it can draw.
    const { container } = draw(
      <OrbitStatus
        latency={500}
        rate={20}
        latencyDomain={[0, 500]}
        rateDomain={[0, 20]}
        threshold={100}
        label="latency"
        size={size}
      />,
    );
    const svg = container.querySelector("svg")!;
    const [w, h] = svg.getAttribute("viewBox")!.split(" ").slice(2).map(Number) as [number, number];

    for (const c of container.querySelectorAll("circle")) {
      const cx = Number(c.getAttribute("cx"));
      const cy = Number(c.getAttribute("cy"));
      const r = Number(c.getAttribute("r"));
      expect(cx - r).toBeGreaterThanOrEqual(0);
      expect(cx + r).toBeLessThanOrEqual(w);
      expect(cy - r).toBeGreaterThanOrEqual(0);
      expect(cy + r).toBeLessThanOrEqual(h);
    }

    const text = container.querySelector("text");
    if (text) {
      const x = Number(text.getAttribute("x"));
      const y = Number(text.getAttribute("y"));
      const fs = Number(text.getAttribute("font-size"));
      // The chart's own per-char over-estimate — the reserved gutter must cover it.
      expect(x + Math.ceil(text.textContent!.length * fs * 0.7)).toBeLessThanOrEqual(w);
      expect(y - fs * ASCENT).toBeGreaterThanOrEqual(0);
      expect(y + fs * DESCENT).toBeLessThanOrEqual(h);
    }
  });

  it("drops the numeral, and its gutter, rather than painting it outside a tiny box", () => {
    // `labelFont` floors at 7, so below ~8 units the em-box cannot fit. The
    // summary still states the ms.
    const { container } = draw(<OrbitStatus latency={240} rate={12} label="latency" size={6} />);
    expect(container.querySelector("text")).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 6 6");
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "240ms latency at 12 calls/s.",
    );
  });

  it("keeps the viewBox on integer coords", () => {
    const { container } = draw(<OrbitStatus latency={240} rate={12} label="latency" />);
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 61 20");
  });
});
