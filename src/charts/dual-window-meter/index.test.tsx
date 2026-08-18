import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { DualWindowMeter, dualWindowSummary } from "./index.js";
import { EN_DUAL_WINDOW } from "../../core/strings-dual-window.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);
const NOISE = Array.from({ length: 40 }, (_, i) => 74 + Math.sin(i / 4) * 3 + (i % 5) * 0.3);

afterEach(() => vi.restoreAllMocks());

describe("<DualWindowMeter>", () => {
  it("renders both traces + target summary leads with the slow read", () => {
    const { container } = draw(<DualWindowMeter data={NOISE} target={75} />);
    expect(container.querySelectorAll("path").length).toBe(2);
    // Both traces are open polylines — each must carry fill="none" or the ink
    // rule fills the M…L… path into a blob (see styles.css accent/data rules).
    for (const p of container.querySelectorAll("path")) expect(p.getAttribute("fill")).toBe("none");
    expect(dualWindowSummary(20.4, 23.1, 23, EN_DUAL_WINDOW, fmt)).toBe(
      "Slow window 23.1 vs target 23; fast 20.4.",
    );
  });

  it("renders a dashed target line", () => {
    const { container } = draw(<DualWindowMeter data={NOISE} target={75} />);
    expect(container.querySelector("line[stroke-dasharray]")).not.toBeNull();
  });

  it("band renders a corridor", () => {
    const { container } = draw(<DualWindowMeter data={NOISE} target={75} band={[72, 78]} />);
    expect(container.querySelector('rect[data-mc-ink="band"]')).not.toBeNull();
  });

  it("fast ≥ slow window swaps with a dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    draw(<DualWindowMeter data={NOISE} target={75} windows={[30, 3]} />);
    expect(warn).toHaveBeenCalled();
  });

  // The 1.3/0.7 stroke pair IS the encoding, so both traces have to be
  // scale-invariant: with only the slow one pinned, the fast trace overtook it
  // past ~1.9× and read as the sustained window.
  it("both traces hold their width ratio at any display scale", () => {
    // Both widths are `calc(var(--mc-sw) * k)`, so both are token-width ink and
    // styles.css pins them. What has to hold here is that neither trace loses
    // its role and drops out of that rule.
    const { container } = draw(<DualWindowMeter data={NOISE} target={75} />);
    const roles = [...container.querySelectorAll("path")].map((p) => p.getAttribute("data-mc-ink"));
    expect(roles.filter(Boolean).length).toBe(roles.length);
  });

  // Hostile CONFIG (not data): a target computed from an empty field arrives
  // NaN or undefined. It used to announce "target NaN" — or throw — over a
  // chart whose dashed line sat at y1="NaN".
  it("a non-finite target reads as an unknown one, and drops its line", () => {
    for (const target of [Number.NaN, Infinity, undefined as unknown as number]) {
      const { container } = draw(<DualWindowMeter data={NOISE} target={target} />);
      expect(container.querySelector("line[stroke-dasharray]")).toBeNull();
      expect(container.querySelector('[role="img"]')!.getAttribute("aria-label")).toBe(
        "Slow window 74.7 vs target —; fast 74.7.",
      );
    }
    expect(dualWindowSummary(20.4, 23.1, Number.NaN, EN_DUAL_WINDOW, fmt)).toBe(
      "Slow window 23.1 vs target —; fast 20.4.",
    );
  });

  it("an unusable domain or corridor never paints NaN", () => {
    for (const ui of [
      () => <DualWindowMeter data={NOISE} target={75} domain={[Number.NaN, Number.NaN]} />,
      () => <DualWindowMeter data={NOISE} target={75} domain={[-Infinity, Infinity]} />,
      () => <DualWindowMeter data={NOISE} target={75} band={[Number.NaN, 78]} />,
    ]) {
      const { container } = draw(ui());
      for (const el of container.querySelectorAll("*"))
        for (const a of el.getAttributeNames())
          expect(el.getAttribute(a), `<${el.tagName} ${a}>`).not.toMatch(/NaN|Infinity/);
    }
  });

  it("is axe-clean", async () => {
    const { container } = draw(<DualWindowMeter data={NOISE} target={75} title="Loudness" />);
    await expectNoA11yViolations(container);
  });

  // Degradation contract: see tests/craft/floor.mjs.
  it("short box: the readouts drop, both traces still render", () => {
    const series = Array.from({ length: 60 }, (_, i) => -22 + Math.sin(i / 4) * 4);
    const big = draw(
      <DualWindowMeter data={series} target={-23} width={320} height={28} />,
    ).container;
    expect(big.querySelector("text")).not.toBeNull();

    // labelFont floors at 7 viewBox units — a 7-unit box seats nothing spare
    const small = draw(
      <DualWindowMeter data={series} target={-23} width={80} height={6} />,
    ).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelectorAll("path").length).toBe(2);
  });

  it("the readout states the level, not every float digit", () => {
    const series = Array.from({ length: 60 }, (_, i) => -22 + Math.sin(i / 4) * 4);
    const { container } = draw(
      <DualWindowMeter data={series} target={-23} width={320} height={28} />,
    );
    for (const t of container.querySelectorAll("text")) {
      const decimals = t.textContent!.split(".")[1] ?? "";
      expect(decimals.length).toBeLessThanOrEqual(1);
    }
  });
});

seriesEdgeSuite("DualWindowMeter", (data: readonly Value[]) => (
  <DualWindowMeter data={data} target={4} title="Edge" />
));
