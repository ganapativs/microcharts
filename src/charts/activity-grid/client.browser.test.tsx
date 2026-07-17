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
    const fig = await mount(<ActivityGrid data={DATA} title="Commits" style={{ width: 600 }} />);
    const svg = fig.querySelector("svg")!;
    const wrapW = fig.getBoundingClientRect().width;
    const svgW = svg.getBoundingClientRect().width;
    expect(wrapW).toBeGreaterThan(560); // wrapper actually stretched
    expect(Math.abs(svgW - wrapW)).toBeLessThan(1.5); // SVG tracks the wrapper
  });

  it("hover ring lands under the cursor in a stretched wrapper", async () => {
    const fig = await mount(<ActivityGrid data={DATA} title="Commits" style={{ width: 600 }} />);
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
});
