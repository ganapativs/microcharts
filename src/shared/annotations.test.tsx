import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Callout, Marker, TargetZone, Threshold } from "./annotations.js";
import { resolveAnnotations } from "./annotations-host.js";
import { Sparkline } from "../charts/sparkline/index.js";
import { SparkBar } from "../charts/sparkbar/index.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const FRAME = {
  x: (i: number) => i * 10,
  y: (v: number) => 20 - v,
  width: 60,
  height: 20,
  fontSize: 6,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolveAnnotations", () => {
  it("splits under (TargetZone) / over (Threshold, Marker, Callout) / rest", () => {
    const { under, over, rest } = resolveAnnotations(
      <>
        <Threshold y={10} />
        <TargetZone y={[5, 15]} />
        <Marker x={2} />
        <Callout x={3} label="dip" />
        <circle cx={1} cy={1} r={1} />
      </>,
      FRAME,
    );
    const u = draw(<svg>{under}</svg>).container;
    expect(u.querySelectorAll('[data-mc-ink="band"]').length).toBe(1);
    const o = draw(<svg>{over}</svg>).container;
    expect(o.querySelectorAll("line").length).toBe(3); // threshold + marker + elbow
    const r = draw(<svg>{rest}</svg>).container;
    expect(r.querySelectorAll("circle").length).toBe(1); // escape hatch survives
  });

  it("out-of-frame coords pin to the edge at 0.4 opacity — never dropped", () => {
    const { over } = resolveAnnotations(<Threshold y={999} />, FRAME);
    const c = draw(<svg>{over}</svg>).container;
    const g = c.querySelector("g")!;
    expect(g.getAttribute("opacity")).toBe("0.4");
    expect(Number(c.querySelector("line")!.getAttribute("y1"))).toBe(0); // clamped
  });

  it("celebrate renders 6 deterministic particles (two renders identical)", () => {
    const run = () =>
      draw(<svg>{resolveAnnotations(<Marker x={4} celebrate />, FRAME).over}</svg>).container
        .innerHTML;
    const a = run();
    expect(a).toBe(run()); // SSR/visual determinism
    expect((a.match(/mc-celebrate/g) ?? []).length).toBe(6);
  });

  it("marker label flips anchor at the edges (pure arithmetic)", () => {
    const at = (x: number) => {
      const { over } = resolveAnnotations(<Marker x={x} label="launch" />, FRAME);
      return draw(<svg>{over}</svg>)
        .container.querySelector("text")!
        .getAttribute("text-anchor");
    };
    expect(at(0)).toBe("start");
    expect(at(3)).toBe("middle");
    expect(at(6)).toBe("end");
  });

  it("long author labels truncate with … to stay inside the frame; short pass through", () => {
    const textOf = (node: React.ReactNode) =>
      draw(<svg>{node}</svg>).container.querySelector("text")!.textContent!;
    const perChar = FRAME.fontSize * 0.62;

    // Threshold + TargetZone end-anchor at width-1 → available run = width - 1
    const longThresh = textOf(
      resolveAnnotations(<Threshold y={10} label={"x".repeat(40)} />, FRAME).over,
    );
    expect(longThresh.endsWith("…")).toBe(true);
    expect(longThresh.length).toBeLessThan(40);
    expect(longThresh.length * perChar).toBeLessThanOrEqual(FRAME.width - 1);

    const longZone = textOf(
      resolveAnnotations(<TargetZone y={[5, 15]} label={"y".repeat(40)} />, FRAME).under,
    );
    expect(longZone.endsWith("…")).toBe(true);
    expect(longZone.length * perChar).toBeLessThanOrEqual(FRAME.width - 1);

    // Callout runs toward the wider half from its anchor tx
    const longCallout = textOf(
      resolveAnnotations(<Callout x={0} label={"z".repeat(40)} />, FRAME).over,
    );
    expect(longCallout.endsWith("…")).toBe(true);
    expect(longCallout.length).toBeLessThan(40);

    // short labels are byte-identical (truncation never engages)
    expect(textOf(resolveAnnotations(<Threshold y={10} label="SLA" />, FRAME).over)).toBe("SLA");
    expect(textOf(resolveAnnotations(<Callout x={0} label="dip" />, FRAME).over)).toBe("dip");
  });

  it("standalone annotation renders nothing + dev-warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(<Threshold y={5} />);
    expect(container.innerHTML).toBe("");
    expect(warn).toHaveBeenCalled();
  });
});

describe("host integration (sparkline + sparkbar retrofit)", () => {
  const DATA = [3, 5, 4, 9, 7, 8];

  it("sparkline renders annotation marks inside its svg; no annotations = unchanged tree", () => {
    const plain = draw(<Sparkline data={DATA} summary={false} />).container.innerHTML;
    const plain2 = draw(<Sparkline data={DATA} summary={false} />).container.innerHTML;
    expect(plain).toBe(plain2);
    const withAnn = draw(
      <Sparkline data={DATA} summary={false}>
        <Threshold y={6} label="SLA" />
        <TargetZone y={[4, 7]} />
        <Marker x={3} label="deploy" />
      </Sparkline>,
    ).container;
    expect(withAnn.querySelectorAll('[data-mc-ink="band"]').length).toBeGreaterThan(0);
    expect(withAnn.querySelector('line[stroke-dasharray="2 2"]')).not.toBeNull();
    const texts = [...withAnn.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toContain("SLA");
    expect(texts).toContain("deploy");
  });

  it("annotation marks stay inside the sparkline viewBox (containment)", () => {
    const { container } = draw(
      <Sparkline data={DATA} summary={false} width={80} height={20}>
        <Threshold y={999} label="way off" />
        <Marker x={0} label="start" />
        <Callout x={5} y={8} label="dip" />
      </Sparkline>,
    );
    for (const el of container.querySelectorAll("line, rect, circle, text")) {
      for (const attr of ["x", "x1", "x2", "cx"]) {
        const v = el.getAttribute(attr);
        if (v !== null) expect(Number(v)).toBeLessThanOrEqual(80);
      }
      for (const attr of ["y", "y1", "y2", "cy"]) {
        const v = el.getAttribute(attr);
        if (v !== null) expect(Number(v)).toBeLessThanOrEqual(20);
      }
    }
  });

  it("sparkbar hosts the same annotations vocabulary", () => {
    const { container } = draw(
      <SparkBar data={DATA} summary={false}>
        <Threshold y={6} />
      </SparkBar>,
    );
    expect(container.querySelector('line[stroke-dasharray="2 2"]')).not.toBeNull();
  });
});
