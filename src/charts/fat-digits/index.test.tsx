import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { FatDigits } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<FatDigits>", () => {
  it("summary is the real string: '{value} — tier {t} of {tiers}.'", () => {
    const { container } = draw(<FatDigits value={1204} domain={[0, 1500]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("1,204 — tier 4 of 5.");
  });

  it("digit mode summary is just the exact value", () => {
    const { container } = draw(<FatDigits value={1204} encode="digit" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("1,204.");
  });

  it("value mode → one weighted tspan carrying the whole numeral", () => {
    const { container } = draw(<FatDigits value={80} domain={[0, 100]} />);
    const tspans = container.querySelectorAll("tspan");
    expect(tspans.length).toBe(1);
    expect(tspans[0]!.textContent).toBe("80");
    expect(tspans[0]!.getAttribute("style")).toContain("font-weight");
  });

  it("digit mode → one tspan per character (incl. the grouping separator)", () => {
    const { container } = draw(<FatDigits value={1902} encode="digit" />);
    expect(container.querySelectorAll("tspan").length).toBe(5); // "1,902"
  });

  it("no domain → the middle tier (docs steer to always pass a domain)", () => {
    const { container } = draw(<FatDigits value={999} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("999 — tier 3 of 5.");
  });

  it("non-finite → 'No data.'", () => {
    const { container } = draw(<FatDigits value={NaN} domain={[0, 100]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
    expect(container.querySelector("text")).toBeNull();
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<FatDigits value={80} domain={[0, 100]} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<FatDigits value={1204} domain={[0, 1500]} title="Revenue" />);
    await expectNoA11yViolations(container);
  });
});

// `value` is scalar, so the shared scalar matrix applies directly. The domain is
// the OTHER numeric input, and its own degenerate shapes are covered below.
valueEdgeSuite("FatDigits", (value: number) => (
  <FatDigits value={value} domain={[0, 2100]} title="Edge" />
));

describe("<FatDigits> degenerate domains (tests/craft/robust.mjs)", () => {
  // A short/non-finite domain used to make the tier ratio NaN, which read an
  // undefined weight and leaked "tier NaN of 5." into the accessible name.
  const DOMAINS: Record<string, readonly number[]> = {
    empty: [],
    "single bound": [0],
    "equal bounds": [100, 100],
    "reversed bounds": [2100, 0],
    "null bounds": [null as unknown as number, null as unknown as number],
    "NaN bound": [0, Number.NaN],
    "±Infinity bounds": [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY],
    "huge span": [0, 1e15],
    "tiny span": [0, 1e-9],
  };

  for (const [label, domain] of Object.entries(DOMAINS)) {
    it(`${label} → a real tier, no non-finite leak`, () => {
      const { container } = draw(
        <FatDigits value={1204} domain={domain as unknown as [number, number]} title="Edge" />,
      );
      const name = container.querySelector("svg")!.getAttribute("aria-label")!;
      expect(name).not.toMatch(/NaN|Infinity|undefined/);
      expect(name).toMatch(/tier [1-5] of 5\.$/);
      for (const el of container.querySelectorAll("*"))
        expect(el.getAttribute("style") ?? "").not.toMatch(/NaN|undefined/);
    });
  }

  it("an unusable domain falls back to the middle tier (as with no domain)", () => {
    const { container } = draw(
      <FatDigits value={1204} domain={[0] as unknown as [number, number]} />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("1,204 — tier 3 of 5.");
  });
});

describe("<FatDigits> hostile config props (tests/craft/robust.mjs)", () => {
  // A non-finite/non-positive fontSize used to reach the box as NaN: `Chart`
  // clamped the viewBox to 1×1 (nothing visible) while the accessible name still
  // read the value, and `NaNpx` landed in --mc-label-size and --mc-seat.
  const SIZES: Record<string, unknown> = {
    NaN: Number.NaN,
    Infinity: Number.POSITIVE_INFINITY,
    "-Infinity": Number.NEGATIVE_INFINITY,
    zero: 0,
    negative: -20,
    null: null,
  };

  for (const [label, fontSize] of Object.entries(SIZES)) {
    it(`fontSize ${label} → the 14-unit default, box intact`, () => {
      const { container } = draw(
        <FatDigits value={1204} domain={[0, 1500]} fontSize={fontSize as number} />,
      );
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe("0 0 48 20");
      expect(svg.getAttribute("style")).toContain("--mc-label-size: 14px");
      expect(svg.getAttribute("style")).not.toMatch(/NaN|Infinity|null/);
      expect(container.querySelector("text")!.getAttribute("font-size")).toBe("14");
      expect(container.querySelector("text")!.getAttribute("y")).toBe("10");
    });
  }

  // The weight table is keyed by `tiers`, so an off-table count read
  // `undefined[idx]` and threw a TypeError out of the whole render.
  for (const tiers of [4, 0, Number.NaN, null]) {
    it(`tiers ${String(tiers)} → the default 5-step scale, announced as 5`, () => {
      const { container } = draw(
        <FatDigits value={1204} domain={[0, 1500]} tiers={tiers as 5} title="Edge" />,
      );
      expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
        "Edge. 1,204 — tier 4 of 5.",
      );
      // announced scale = painted scale: tier 4 of the 5-step table is 750
      expect(container.querySelector("tspan")!.getAttribute("style")).toContain("font-weight: 750");
    });
  }

  it("tiers=3 still selects the 3-step table", () => {
    const { container } = draw(<FatDigits value={1204} domain={[0, 1500]} tiers={3} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("1,204 — tier 3 of 3.");
  });
});
