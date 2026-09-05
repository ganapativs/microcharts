import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { StarSpoke, starSpokeSummary } from "./index.js";
import { EN_STAR_SPOKE } from "../../core/strings-star-spoke.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);

const PROFILE = [
  { label: "Speed", value: 0.9 },
  { label: "Power", value: 0.6 },
  { label: "Range", value: 0.5 },
  { label: "Cost", value: 0.3 },
  { label: "Ease", value: 0.7 },
];

afterEach(() => vi.restoreAllMocks());

describe("<StarSpoke>", () => {
  // A rim label is SEATED at its spoke and only nudged inward far enough to stay
  // in the box, so the estimate that sizes the nudge has to be a realistic
  // advance. Sized off the pathological all-`W` bound instead, `Power` moved
  // from 57.1 to 41.5 on an 80-unit box whose centre is 40 — inside the
  // viewBox, and sitting on the spokes. Containment cannot catch that; the
  // seat coordinates can, so they are pinned — and these are `main`'s, because
  // mixed-case text keeps the 0.62 rate it always had. Only capitals widen.
  it("seats side labels clear of the star, not merely inside the viewBox", () => {
    const data = [
      { label: "Speed", value: 0.8 },
      { label: "Power", value: 0.5 },
      { label: "Range", value: 0.3 },
      { label: "Cost", value: 0.6 },
      { label: "Ease", value: 0.4 },
    ];
    const { container } = draw(<StarSpoke data={data} size={80} />);
    const seats = Object.fromEntries(
      [...container.querySelectorAll("text")].map((t) => [
        t.textContent,
        Number(t.getAttribute("x")),
      ]),
    );
    expect(seats).toEqual({ Speed: 40, Power: 54.7, Range: 54.7, Cost: 24.48, Ease: 20.34 });
  });

  it("renders a value spoke path + a guide path summary", () => {
    const { container } = draw(<StarSpoke data={PROFILE} />);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
    expect(starSpokeSummary(PROFILE, EN_STAR_SPOKE, fmt)).toBe(
      "5 metrics; highest Speed (0.9), lowest Cost (0.3).",
    );
  });

  it("never renders a closed contour polygon", () => {
    const { container } = draw(<StarSpoke data={PROFILE} />);
    const paths = [...container.querySelectorAll("path")].map((p) => p.getAttribute("d") || "");
    expect(paths.every((d) => !d.includes("Z"))).toBe(true);
  });

  it("a label that doesn't seat drops out cleanly instead of clamping into overlap", () => {
    const { container } = draw(
      <StarSpoke
        data={[
          { label: "Reliability", value: 0.9 },
          { label: "Throughput", value: 0.6 },
          { label: "Cost efficiency", value: 0.5 },
        ]}
        size={48}
      />,
    );
    const labels = [...container.querySelectorAll('text[data-mc-ink="label"]')].map(
      (t) => t.textContent,
    );
    // long labels at a small size don't all seat — none render squeezed/overlapping
    expect(labels.length).toBeLessThan(3);
  });

  it("dots render endpoint markers in data ink, with no inline paint", () => {
    const { container } = draw(<StarSpoke data={PROFILE} dots="tips" size={64} />);
    const tips = container.querySelector('path[data-mc-ink="point"]')!;
    expect(tips).not.toBeNull();
    // The tip dot says what the spoke end already says, so it takes the same
    // ink. An inline `fill` here outranked the point role's forced-colors
    // mapping and painted the brand accent verbatim in High Contrast Mode.
    expect(tips.getAttribute("style")).toBeNull();
    expect(tips.getAttribute("fill")).toBeNull();
  });

  it("compare draws a ghost baseline", () => {
    const { container } = draw(<StarSpoke data={PROFILE} compare={[0.5, 0.5, 0.5, 0.5, 0.5]} />);
    expect(container.querySelector('path[data-mc-ink="ghost"]')).not.toBeNull();
  });

  // The spoke angle is i/n, so a baseline shorter than the profile used to get
  // its own smaller `n` and every ghost landed on the wrong axis.
  it("a short compare keeps each baseline on its own axis", () => {
    const { container } = draw(<StarSpoke data={PROFILE} compare={[0.5, 0.5]} />);
    const tips = (ink: string) =>
      container
        .querySelector(`path[data-mc-ink="${ink}"]`)!
        .getAttribute("d")!
        .split("M")
        .slice(1)
        .map((seg) => seg.split("L")[1]!.split(" ").map(Number) as [number, number]);

    const ghosts = tips("ghost");
    const guides = tips("muted");
    expect(ghosts).toHaveLength(PROFILE.length);
    const C = 40; // centre of the 80-unit default box
    ghosts.forEach(([gx, gy], i) => {
      if (gx === C && gy === C) return; // no baseline for this metric — collapsed to the hub
      const [rx, ry] = guides[i]!;
      expect(Math.atan2(gy! - C, gx! - C)).toBeCloseTo(Math.atan2(ry! - C, rx! - C), 6);
    });
  });

  it("fewer than 3 metrics warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    draw(
      <StarSpoke
        data={[
          { label: "a", value: 0.5 },
          { label: "b", value: 0.8 },
        ]}
      />,
    );
    expect(warn).toHaveBeenCalled();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<StarSpoke data={PROFILE} title="Product profile" />);
    await expectNoA11yViolations(container);
  });

  describe("degenerate values", () => {
    it("an unmeasured metric can't be an extreme, but still counts", () => {
      expect(
        starSpokeSummary(
          [{ label: "Speed", value: null as unknown as number }, ...PROFILE.slice(1)],
          EN_STAR_SPOKE,
          fmt,
        ),
      ).toBe("5 metrics; highest Ease (0.7), lowest Cost (0.3).");
    });

    it("nothing measured reads as no data, never as NaN or ∞", () => {
      expect(
        starSpokeSummary(
          PROFILE.map((d) => ({ ...d, value: null as unknown as number })),
          EN_STAR_SPOKE,
          fmt,
        ),
      ).toBe("No data.");
      expect(
        starSpokeSummary(
          PROFILE.map((d) => ({ ...d, value: Number.NaN })),
          EN_STAR_SPOKE,
          fmt,
        ),
      ).toBe("No data.");
    });

    it("all-unmeasured still draws the guide scaffold — empty is visible", () => {
      const { container } = draw(
        <StarSpoke data={PROFILE.map((d) => ({ ...d, value: null as unknown as number }))} />,
      );
      expect(container.querySelector('path[data-mc-ink="muted"]')!.getAttribute("d")).not.toBe("");
    });
  });
});

// Hostile CONFIG, not hostile data: a host derives `domain` with a reduce over
// a series holding a NaN, or binds `size` to an empty number field. Both used
// to send every spoke coordinate to NaN — the path is then invalid and the
// browser drops it, so the star painted EMPTY under an accessible name that
// still read a perfectly normal profile.
describe("<StarSpoke> hostile config", () => {
  const labelOf = (c: HTMLElement) => c.querySelector("svg")!.getAttribute("aria-label");
  const baseline = () => draw(<StarSpoke data={PROFILE} />).container;

  for (const [name, domain] of [
    ["both ends NaN", [NaN, NaN]],
    ["low end NaN", [NaN, 1]],
    ["high end NaN", [0, NaN]],
    ["unbounded", [-Infinity, Infinity]],
    ["span overflows", [-1e308, 1e308]],
  ] as const) {
    it(`non-finite domain (${name}) falls back to the unit domain`, () => {
      const { container } = draw(<StarSpoke data={PROFILE} domain={domain} />);
      expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
      expect(container.querySelector('path[data-mc-ink="data"]')!.getAttribute("d")).toBe(
        baseline().querySelector('path[data-mc-ink="data"]')!.getAttribute("d"),
      );
      expect(labelOf(container)).toBe(labelOf(baseline()));
    });
  }

  for (const [name, size] of [
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["zero", 0],
    ["negative", -20],
  ] as const) {
    it(`an unusable size (${name}) falls back to the default box, not NaN coords`, () => {
      const { container } = draw(<StarSpoke data={PROFILE} size={size} />);
      expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 80 80");
      expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    });
  }

  // A box smaller than twice the 2-unit pad inverted the radius: spokes ran
  // backwards and the guide rim landed outside the viewBox (`.mc-root` is
  // overflow: visible, so that paints on the page).
  it("a sub-pad size keeps every mark inside the viewBox", () => {
    const { container } = draw(<StarSpoke data={PROFILE} size={3} />);
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 3 3");
    // guide + spoke paths are absolute M/L only, so every number is a coord
    for (const p of container.querySelectorAll("path")) {
      for (const n of (p.getAttribute("d") || "").match(/-?\d+(\.\d+)?/g) ?? []) {
        expect(Number(n)).toBeGreaterThanOrEqual(0);
        expect(Number(n)).toBeLessThanOrEqual(3);
      }
    }
  });
});

// `value` is typed `number`, but an unmeasured metric is a real state. The
// previous spelling of this suite laundered every gap into `value: 0` before the
// chart saw it, which hid the `toPrecision` crash and drew "no data" as zero.
mappedEdgeSuite(
  "StarSpoke",
  (v, i) => ({ label: `m${i}`, value: v as number }),
  (data) => <StarSpoke data={data} domain={[0, 1]} title="Edge" />,
);
