import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { DataDiff } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const DIFF = [
  { key: "users", added: 340, removed: 120 },
  { key: "orders", added: 88, removed: 30 },
  { key: "items", added: 40, removed: 20 },
  { key: "tags", added: 24, removed: 8 },
  { key: "notes", added: 12, removed: 6 },
  { key: "flags", added: 8, removed: 3 },
];

describe("<DataDiff>", () => {
  it("summary names totals, key count, and the largest change — the real string", () => {
    const { container } = draw(<DataDiff data={DIFF} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "+512 added, −187 removed across 6 keys; largest change: users (+220).",
    );
  });

  it("no changes anywhere → 'No changes across N keys.'", () => {
    const { container } = draw(<DataDiff data={[{ key: "a", added: 0, removed: 0 }]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "No changes across 1 keys.",
    );
  });

  it("both bars per row + a center hairline (never netted by default)", () => {
    const { container } = draw(<DataDiff data={DIFF} width={80} />);
    const bars = container.querySelectorAll(
      'rect[data-mc-ink="positive"], rect[data-mc-ink="negative"]',
    );
    // 6 rows × 2 bars each = 12
    expect(bars.length).toBe(12);
    expect(container.querySelector("line")).not.toBeNull(); // zero hairline
  });

  it("removed bars carry the negative ink role, added carry positive", () => {
    const { container } = draw(<DataDiff data={[{ key: "a", added: 10, removed: 5 }]} />);
    expect(container.querySelectorAll('rect[data-mc-ink="negative"]').length).toBe(1);
    expect(container.querySelectorAll('rect[data-mc-ink="positive"]').length).toBe(1);
  });

  it("a 0/0 key still renders a placeholder tick", () => {
    const { container } = draw(
      <DataDiff data={[{ key: "same", added: 0, removed: 0 }]} width={80} />,
    );
    expect(container.querySelector('rect[data-mc-ink="neutral"]')).not.toBeNull();
  });

  it("labels opts in key tags (when rows have room); off by default", () => {
    const off = draw(<DataDiff data={DIFF} height={64} />).container;
    const on = draw(<DataDiff data={DIFF} labels height={64} />).container;
    expect(off.querySelector("text")).toBeNull();
    expect([...on.querySelectorAll("text")].map((t) => t.textContent)).toContain("users");
  });

  it("labels degrade away when rows are too thin to fit text", () => {
    // 6 rows in 20px → no vertical room; tags drop rather than overlap/escape
    const { container } = draw(<DataDiff data={DIFF} labels height={20} />);
    expect(container.querySelector("text")).toBeNull();
  });

  it("label='totals' prints a +added / −removed footer", () => {
    const { container } = draw(<DataDiff data={DIFF} label="totals" height={48} />);
    const footer = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(footer).toContain("+512 / −187");
  });

  it("net opts in a summary tick per row", () => {
    const off = draw(<DataDiff data={DIFF} />).container;
    const on = draw(<DataDiff data={DIFF} net />).container;
    const offTicks = off.querySelectorAll('rect[data-mc-ink="neutral"]').length;
    const onTicks = on.querySelectorAll('rect[data-mc-ink="neutral"]').length;
    expect(onTicks).toBeGreaterThan(offTicks);
  });

  it("paints the bars its accessible name announces, even on a broken domain", () => {
    const { container } = draw(<DataDiff data={DIFF} domain={[0, NaN]} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toBe(
      "+512 added, −187 removed across 6 keys; largest change: users (+220).",
    );
    expect(
      container.querySelectorAll('rect[data-mc-ink="positive"], rect[data-mc-ink="negative"]')
        .length,
    ).toBe(12);
  });

  it("a NaN maxItems shows the 12-row cap, not an empty chart", () => {
    const { container } = draw(<DataDiff data={DIFF} maxItems={NaN} />);
    expect(container.querySelectorAll('rect[data-mc-ink="positive"]').length).toBe(6);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain("across 6 keys");
  });

  it("roomier rows keep their key tags (they used to invert and drop)", () => {
    // 3 rows in 64 units gives a big row pitch, whose pitch-sized tag font blew
    // the gutter budget; the tags must shrink to fit rather than disappear.
    const { container } = draw(<DataDiff data={DIFF.slice(0, 3)} labels height={64} />);
    expect([...container.querySelectorAll("text")].map((t) => t.textContent)).toContain("users");
  });

  it("the net tick stays inside the viewBox at a punishing row pitch", () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({
      key: `k${i}`,
      added: 20 - i,
      removed: i,
    }));
    const H = 10;
    const { container } = draw(<DataDiff data={rows} net height={H} />);
    for (const r of container.querySelectorAll("rect")) {
      const y = Number(r.getAttribute("y"));
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y + Number(r.getAttribute("height"))).toBeLessThanOrEqual(H);
    }
  });

  it("is axe-clean", async () => {
    const { container } = draw(<DataDiff data={DIFF} title="Schema diff" />);
    await expectNoA11yViolations(container);
  });
});
