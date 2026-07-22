import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Delta } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

// Apex = the lone y among the triangle's three vertices; base = the repeated y.
// In viewBox y-down space, apex above base (apexY < baseY) points up, and below
// (apexY > baseY) points down. Guards against the up/down glyph pointing the
// wrong way (both once shared the same downward triangle).
function apexPointsUp(pathD: string): boolean {
  const ys = [...pathD.matchAll(/-?\d+(?:\.\d+)?/g)]
    .map((m) => Number(m[0]))
    .filter((_, i) => i % 2 === 1); // y is every 2nd number in "x y" pairs
  const counts = new Map<number, number>();
  for (const y of ys) counts.set(y, (counts.get(y) ?? 0) + 1);
  const apex = [...counts].find(([, c]) => c === 1)?.[0];
  const base = [...counts].find(([, c]) => c > 1)?.[0];
  return apex !== undefined && base !== undefined && apex < base;
}

describe("<Delta>", () => {
  it("up glyph points up and down glyph points down (honest direction)", () => {
    const up = draw(<Delta value={0.1} />)
      .container.querySelector(".mc-delta path")!
      .getAttribute("d")!;
    const down = draw(<Delta value={-0.1} />)
      .container.querySelector(".mc-delta path")!
      .getAttribute("d")!;
    expect(up).not.toBe(down);
    expect(apexPointsUp(up)).toBe(true);
    expect(apexPointsUp(down)).toBe(false);
  });

  it("positive value → up glyph, positive valence, signed percent", () => {
    const { container } = draw(<Delta value={0.124} />);
    const el = container.querySelector(".mc-delta")!;
    expect(el.getAttribute("data-mc-valence")).toBe("pos");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Up 12.4%.");
    expect(container.querySelector(".mc-delta-num")!.textContent).toBe("+12.4%");
  });

  it("negative value → down glyph + negative valence + minus sign", () => {
    const { container } = draw(<Delta value={-0.03} />);
    const el = container.querySelector(".mc-delta")!;
    expect(el.getAttribute("data-mc-valence")).toBe("neg");
    expect(el.getAttribute("aria-label")).toBe("Down 3%.");
    expect(container.querySelector(".mc-delta-num")!.textContent).toBe("−3%");
  });

  it("zero → flat glyph, neutral valence, 'No change.'", () => {
    const { container } = draw(<Delta value={0} />);
    const el = container.querySelector(".mc-delta")!;
    expect(el.getAttribute("data-mc-valence")).toBe("flat");
    expect(el.getAttribute("aria-label")).toBe("No change.");
  });

  it("positive='down' inverts valence color (down is good)", () => {
    // latency dropped 10% → good
    const { container } = draw(<Delta value={-0.1} positive="down" />);
    expect(container.querySelector(".mc-delta")!.getAttribute("data-mc-valence")).toBe("pos");
  });

  it("from → derives percent change and its direction", () => {
    const { container } = draw(<Delta value={120} from={100} />);
    const el = container.querySelector(".mc-delta")!;
    expect(el.getAttribute("aria-label")).toBe("Up 20%.");
    expect(container.querySelector(".mc-delta-num")!.textContent).toBe("+20%");
  });

  it("custom format (absolute) is honored", () => {
    const { container } = draw(
      <Delta
        value={1500}
        format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
      />,
    );
    expect(container.querySelector(".mc-delta-num")!.textContent).toBe("+$1,500");
  });

  it("non-finite value → em-dash + 'No change.', not 'NaN%'", () => {
    const { container } = draw(<Delta value={Number.NaN} />);
    const el = container.querySelector(".mc-delta")!;
    expect(el.getAttribute("data-mc-valence")).toBe("flat");
    expect(el.getAttribute("aria-label")).toBe("No change.");
    expect(container.querySelector(".mc-delta-num")!.textContent).toBe("—");
  });

  it("summary={false} → decorative: no role; number stays in the text flow", () => {
    const { container } = draw(<Delta value={0.1} summary={false} />);
    const el = container.querySelector(".mc-delta")!;
    expect(el.getAttribute("aria-hidden")).toBeNull();
    expect(el.getAttribute("role")).toBeNull();
    expect(el.querySelector(".mc-delta-num")!.getAttribute("aria-hidden")).toBeNull();
    expect(el.querySelector(".mc-delta-num")!.textContent).toMatch(/\+/);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Delta value={0.124} title="Revenue" />);
    await expectNoA11yViolations(container);
  });
});

valueEdgeSuite("Delta", (value) => <Delta value={value} title="Edge" />);
