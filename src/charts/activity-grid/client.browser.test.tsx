import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { ActivityGrid } from "./client.js";

// 14 columns × 7 rows, ascending so levels are easy to reason about.
const DATA = Array.from({ length: 98 }, (_, i) => i);

const mount = async (ui: React.ReactNode) => {
  const screen = await render(ui);
  return screen.getByRole("img").element() as HTMLElement;
};

describe("interactive <ActivityGrid>", () => {
  it("focusable role=img with the total/peak name", async () => {
    const fig = await mount(<ActivityGrid data={DATA} title="Commits" />);
    expect(fig.getAttribute("tabindex")).toBe("0");
    expect(fig.getAttribute("aria-label")).toMatch(/Commits\. Total .* Busiest 97\./);
  });

  it("keyboard: Home selects the first cell; arrows walk in 2-D; announces", async () => {
    const fig = await mount(<ActivityGrid data={DATA} title="Commits" />);
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(live.textContent).toBe("Point 1 of 98: 0.");
    await userEvent.keyboard("{ArrowDown}"); // next row, same (first) column → index 1
    expect(live.textContent).toBe("Point 2 of 98: 1.");
    await userEvent.keyboard("{ArrowRight}"); // next column, same row → index 1+7 = 8
    expect(live.textContent).toBe("Point 9 of 98: 8.");
    await userEvent.keyboard("{Escape}");
    expect(live.textContent).toBe("");
  });

  // Kernel contract: with nothing active, the FIRST arrow lands on unit 0 —
  // it does not step off index 0 into the next column.
  it("first arrow from nothing lands on cell 0", async () => {
    const fig = await mount(<ActivityGrid data={DATA} title="Commits" />);
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Point 1 of 98: 0.");
  });

  it("focusing a cell rings it (accent outline)", async () => {
    const fig = await mount(<ActivityGrid data={DATA} title="Commits" />);
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(fig.querySelector('rect[stroke="var(--mc-accent)"]')).not.toBeNull();
  });

  // Regression: the composed static SVG must FILL the wrapper. If a consumer
  // stretches the wrapper (a `width:100%` class, a flex/grid cell), the inner
  // SVG has to grow with it — otherwise the wrapper-based pointer map and the
  // viewBox-drawn ring reference different widths and the hover ring drifts far
  // from the cursor (the "cursor right / highlight left" bug).
  it("inner SVG fills a stretched wrapper (no pointer/ring decoupling)", async () => {
    // Override wrap()'s maxWidth:100% so an explicit px width isn't capped by
    // the browser viewport (vitest's iframe can be < 600px wide).
    const fig = await mount(
      <ActivityGrid data={DATA} title="Commits" style={{ width: 600, maxWidth: 600 }} />,
    );
    const svg = fig.querySelector("svg")!;
    const wrapW = fig.getBoundingClientRect().width;
    const svgW = svg.getBoundingClientRect().width;
    expect(wrapW).toBeGreaterThan(560); // wrapper actually stretched
    expect(Math.abs(svgW - wrapW)).toBeLessThan(1.5); // SVG tracks the wrapper
  });

  it("hover ring lands under the cursor in a stretched wrapper", async () => {
    const fig = await mount(
      <ActivityGrid data={DATA} title="Commits" style={{ width: 600, maxWidth: 600 }} />,
    );
    const r = fig.getBoundingClientRect();
    const cx = r.left + r.width * 0.85;
    const cy = r.top + r.height / 2;
    fig.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: cx, clientY: cy }));
    const ring = await vi.waitFor(() => {
      const el = fig.querySelector('rect[stroke="var(--mc-accent)"]');
      if (!el) throw new Error("no ring");
      return el;
    });
    const rb = ring.getBoundingClientRect();
    const ringCx = rb.left + rb.width / 2;
    // rendered cell width ≈ wrapper/columns; ring center must be within one cell of the cursor
    const cellPx = r.width / 14;
    expect(Math.abs(ringCx - cx)).toBeLessThan(cellPx);
  });

  // Regression: `.mc-inline` seats a mark by translating `.mc-root`, which moves
  // what is PAINTED but not the wrapper the readout chip is positioned against —
  // the chip floated a whole seat away from its mark. The seat is hoisted to the
  // wrapper so one element seats the whole box. (This asserts the hoist itself;
  // the resulting geometry is measured against the built docs, since the browser
  // test environment does not load styles.css.)
  it("hoists the chart's seat from the SVG up to the wrapper when inline", async () => {
    const screen = await render(
      <span className="mc-inline">
        <ActivityGrid data={DATA} />
      </span>,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    const svg = fig.querySelector("svg")!;
    await vi.waitFor(() => {
      if (!fig.hasAttribute("data-mc-seated")) throw new Error("not hoisted");
    });
    // the wrapper now carries the seat the <Chart> emitted…
    expect(fig.style.getPropertyValue("--mc-seat")).toBe(svg.style.getPropertyValue("--mc-seat"));
    expect(fig.style.getPropertyValue("--mc-seat")).not.toBe("");
  });

  it("does not hoist a seat when the chart is not inline", async () => {
    const fig = await mount(<ActivityGrid data={DATA} />);
    await new Promise((r) => setTimeout(r, 20)); // let the effect run
    expect(fig.hasAttribute("data-mc-seated")).toBe(false);
  });
});
