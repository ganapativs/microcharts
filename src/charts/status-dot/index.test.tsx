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
    expect(ok.style.fill).not.toBe("none");
    expect(off.style.fill).toBe("none");
    expect(off.style.stroke).not.toBe("none");
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
    expect((mark as SVGElement).style.fill).toBe("rebeccapurple");
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
