import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { StatusDot, STATUS_STATES } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

// Shared numeric edge matrix does not apply: the data shape is a string state
// key, not numbers. The categorical degenerate — an unknown key
// is covered below instead.

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<StatusDot>", () => {
  it("each built-in state renders a distinct silhouette (never color-alone)", () => {
    const shapes = Object.keys(STATUS_STATES).map((status) => {
      const { container } = draw(<StatusDot status={status} />);
      const mark = container.querySelector("[data-mc-status]")!;
      return `${mark.tagName}:${mark.getAttribute("data-mc-status")}`;
    });
    expect(new Set(shapes).size).toBe(5);
  });

  it("ok → filled circle; off → hollow ring (fill state is shape too)", () => {
    const ok = draw(<StatusDot status="ok" />).container.querySelector("circle")!;
    const off = draw(<StatusDot status="off" />).container.querySelector("circle")!;
    expect(ok.getAttribute("fill")).not.toBe("none");
    expect(off.getAttribute("fill")).toBe("none");
    expect(off.getAttribute("stroke")).not.toBe("none");
  });

  // The paint is dynamic, so it has to come from the component — but an inline
  // `style` outranks every author rule, and `.mc-root` sets
  // `forced-color-adjust: none`, so the forced-colors mapping styles.css writes
  // for `[data-mc-status]` never applied and High Contrast Mode painted the raw
  // token hue. Attributes sit below the stylesheet; that mapping is what makes
  // this chart legible there, so nothing here may go back to `style`.
  it("paint rides attributes, never inline style (forced-colors can reach it)", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    // "unpainted" and not "banana": devWarn dedupes by message for the module's
    // lifetime, so sharing an unknown key silences a later test's warn assertion.
    const styled: string[] = [];
    const unmapped: string[] = [];
    for (const status of [...Object.keys(STATUS_STATES), "unpainted"]) {
      for (const pulse of [false, true]) {
        const { container } = draw(<StatusDot status={status} pulse={pulse} />);
        for (const el of container.querySelectorAll<SVGElement>("svg *")) {
          const at = `${status}${pulse ? "+pulse" : ""} <${el.tagName}>`;
          if (el.style.cssText !== "") styled.push(`${at} style="${el.style.cssText}"`);
          // Every mark the chart paints, the halo and the busy half-disc
          // included, has to be reachable by that mapping.
          if (!el.hasAttribute("data-mc-status")) unmapped.push(at);
        }
      }
    }
    expect(styled).toEqual([]);
    expect(unmapped).toEqual([]);
  });

  it("hollow marks declare fill='none' as a literal attribute", () => {
    // styles.css's last forced-colors rule is `[fill="none"] { fill: none }` and
    // it reads the ATTRIBUTE — the only signal CSS has that an outline is an
    // outline. A ring filled solid in High Contrast Mode is a different state.
    for (const status of ["off", "busy"]) {
      const { container } = draw(<StatusDot status={status} />);
      expect(container.querySelector("circle")!.getAttribute("fill")).toBe("none");
    }
  });

  it("the pulse halo is mapped ink, and is not the silhouette", () => {
    const { container } = draw(<StatusDot status="warn" pulse />);
    const halo = container.querySelector(".mc-status-halo")!;
    expect(halo.getAttribute("data-mc-status")).toBe("halo");
    // "halo" stays outside the glyph vocabulary so the value-scoped ring/half
    // rules can't claim it and a silhouette query can exclude it by class.
    const mark = container.querySelector("[data-mc-status]:not(.mc-status-halo)")!;
    expect(mark.getAttribute("data-mc-status")).toBe("triangle");
  });

  it("a prototype-chain key is an unknown status, not a crash", () => {
    // `status` is data: any string is in contract. The plain lookup resolved
    // these through Object.prototype to a truthy function with no `glyph`, and
    // the render threw on `mark.kind` — taking the host tree down with it.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const key of ["constructor", "toString", "valueOf", "__proto__"]) {
      const { container } = draw(<StatusDot status={key} />);
      expect(container.querySelector('[data-mc-status="ring"]')).not.toBeNull();
      expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("Status: off.");
    }
    expect(warn).toHaveBeenCalled();
  });

  it("summary: 'Status: warning.' — the docs' real string", () => {
    const { container } = draw(<StatusDot status="warn" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("Status: warning.");
  });

  it("custom states extend the vocabulary; label feeds the summary", () => {
    const { container } = draw(
      <StatusDot
        status="degraded"
        states={{ degraded: { glyph: "triangle", token: "--mc-cat-1", label: "degraded" } }}
      />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("Status: degraded.");
    expect(container.querySelector('[data-mc-status="triangle"]')).not.toBeNull();
  });

  it("unknown status → off glyph + dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(<StatusDot status="banana" />);
    // off = hollow ring
    const mark = container.querySelector('[data-mc-status="ring"]')!;
    expect(mark).not.toBeNull();
    expect(warn).toHaveBeenCalledOnce(); // devWarn dedupes StrictMode's double render
  });

  it("pulse → halo node present; without pulse node budget ≤ 2", () => {
    const pulsing = draw(<StatusDot status="busy" pulse />).container;
    expect(pulsing.querySelector(".mc-status-halo")).not.toBeNull();
    const plain = draw(<StatusDot status="ok" />).container;
    expect(plain.querySelectorAll("svg *").length).toBeLessThanOrEqual(2);
  });

  it("color recolors but never reshapes", () => {
    const { container } = draw(<StatusDot status="error" color="rebeccapurple" />);
    const mark = container.querySelector('[data-mc-status="diamond"]')!;
    expect(mark.getAttribute("fill")).toBe("rebeccapurple");
  });

  it("summary={false} → decorative", () => {
    const { container } = draw(<StatusDot status="ok" summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<StatusDot status="warn" title="API" />);
    await expectNoA11yViolations(container);
  });
});
