import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Chart } from "./Chart.js";
import { MicroProvider } from "./MicroProvider.js";

describe("Chart (a11y composition, plan/08)", () => {
  it("is a role=img svg with an integer viewBox and mc-root class", () => {
    const { container } = render(<Chart width={80} height={20} summary="Trending up." />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("viewBox")).toBe("0 0 80 20");
    expect(svg.classList.contains("mc-root")).toBe(true);
  });

  it("default (no id): deterministic aria-label composed from title + summary — hydration-safe, no generated ids", () => {
    const { container } = render(
      <Chart width={80} height={20} title="Revenue" summary="Trending up 12%." />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toBe("Revenue. Trending up 12%.");
    expect(svg.getAttribute("aria-labelledby")).toBeNull();
    // <title> still renders (hover/secondary naming) but carries no generated id
    const titleEl = container.querySelector("title")!;
    expect(titleEl.textContent).toBe("Revenue");
    expect(titleEl.hasAttribute("id")).toBe(false);
    // <desc> only exists in explicit-id mode
    expect(container.querySelector("desc")).toBeNull();
  });

  it("decorative (summary=false) → aria-hidden, no role, no title/desc", () => {
    const { container } = render(<Chart width={80} height={20} title="x" summary={false} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("role")).toBeNull();
    expect(container.querySelector("title")).toBeNull();
    expect(container.querySelector("desc")).toBeNull();
  });

  it("explicit id: full <title>/<desc> + aria-labelledby wiring", () => {
    const { container } = render(
      <Chart width={10} height={10} id="fixed" title="T" summary="S" className="cell" />,
    );
    expect(container.querySelector("title")!.id).toBe("fixed-t");
    expect(container.querySelector("desc")!.id).toBe("fixed-d");
    expect(container.querySelector("svg")!.getAttribute("aria-labelledby")).toBe("fixed-t fixed-d");
    expect(container.querySelector("svg")!.getAttribute("class")).toBe("mc-root cell");
  });
});

describe("MicroProvider (theming, plan/06)", () => {
  it("modern (default) sets no data-mc-theme attribute", () => {
    const { container } = render(<MicroProvider>x</MicroProvider>);
    expect(container.firstElementChild!.hasAttribute("data-mc-theme")).toBe(false);
  });

  it("applies a preset and one-off token overrides", () => {
    const { container } = render(
      <MicroProvider theme="tufte" tokens={{ "--mc-accent": "#f50" }}>
        x
      </MicroProvider>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("data-mc-theme")).toBe("tufte");
    expect(el.style.getPropertyValue("--mc-accent")).toBe("#f50");
  });
});
