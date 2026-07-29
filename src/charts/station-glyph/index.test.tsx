import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { StationGlyph, stationGlyphSummary } from "./index.js";
import { EN_STATION_GLYPH } from "../../core/strings-station-glyph.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);
const OBS = {
  cloud: 0.75,
  wind: { direction: 225, magnitude: 15 },
  temp: 16,
  dewpoint: 9,
  pressure: 1013,
  station: "KSFO",
} as const;

describe("<StationGlyph>", () => {
  it("draws the disc, a cloud sector, corner numerals, and a wind barb", () => {
    const { container } = draw(<StationGlyph {...OBS} size={34} />);
    expect(container.querySelector("circle")).not.toBeNull();
    expect(container.querySelectorAll("path").length).toBeGreaterThanOrEqual(2); // cloud sector + barb
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toEqual(expect.arrayContaining(["KSFO", "16°", "9°", "1,013"]));
  });

  it("summary", () => {
    expect(stationGlyphSummary(OBS, EN_STATION_GLYPH, fmt)).toBe(
      "KSFO, wind southwest 15; sky broken, 16° / 9°, 1,013.",
    );
  });

  it("calm wind and clear sky read correctly", () => {
    expect(
      stationGlyphSummary(
        { cloud: 0, wind: { direction: 0, magnitude: 0 }, station: "STN" },
        EN_STATION_GLYPH,
        fmt,
      ),
    ).toBe("STN, wind calm; sky clear.");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<StationGlyph {...OBS} title="Observation" size={34} />);
    await expectNoA11yViolations(container);
  });

  it("numerals take label ink, never the categorical ramp", () => {
    // The cat forced-colors mapping is written for closed shapes (it strokes a
    // Canvas hairline between adjacent segments); on text it knocks that stroke
    // through the glyphs. text[data-mc-ink="label"] has its own mapping.
    const { container } = draw(<StationGlyph {...OBS} size={34} />);
    const texts = [...container.querySelectorAll("text")];
    expect(texts.map((t) => t.getAttribute("data-mc-ink"))).toEqual(texts.map(() => "label"));
    expect(container.querySelector("text[data-mc-cat]")).toBeNull();
  });
});

describe("<StationGlyph> hostile config", () => {
  // `step` and `size` are host-computed as often as typed — `Number(field.value)`
  // on an empty input is NaN. Each of these put NaN or a nonsense scale into the
  // viewBox, the seat, the coordinates, or the announced wind.
  const markup = (props: object) => draw(<StationGlyph {...OBS} {...props} />).container.innerHTML;

  const HOSTILE = {
    "step NaN": { step: Number.NaN },
    "step zero": { step: 0 },
    "step negative": { step: -10 },
    "step Infinity": { step: Number.POSITIVE_INFINITY },
    "size NaN": { size: Number.NaN },
    "size zero": { size: 0 },
    "size negative": { size: -40 },
    "size Infinity": { size: Number.POSITIVE_INFINITY },
  } as const;

  for (const [name, props] of Object.entries(HOSTILE)) {
    it(`${name} falls back to the documented default`, () => {
      expect(markup(props)).toBe(markup({}));
    });
  }

  it("a non-finite wind direction drops the barb AND the wind clause", () => {
    // It used to emit `MNaN NaN` for the shaft while announcing "wind undefined
    // 15" — `compass8[octant(NaN)]` is undefined. A barb is an angle plus a
    // feather count, so no angle means no wind field, the same answer a
    // non-finite magnitude already got.
    for (const direction of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const { container } = draw(
        <StationGlyph {...OBS} wind={{ direction, magnitude: 15 }} size={34} />,
      );
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("aria-label")).toBe("KSFO; sky broken, 16° / 9°, 1,013.");
      expect(container.innerHTML).not.toMatch(/NaN|Infinity|undefined/);
    }
  });

  it("announced wind and painted barb agree on the quantum", () => {
    // step NaN announced "wind southwest 15" and drew no barb at all.
    const { container } = draw(<StationGlyph {...OBS} step={Number.NaN} size={34} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "wind southwest 15",
    );
    expect(container.querySelectorAll("path").length).toBeGreaterThanOrEqual(2);
  });
});

// Per-char extents from core/labels.ts: 0.62 covers the figures this chart
// formats, 0.95 covers the caller-supplied station id.
const rate = (t: Element, station: string) => (t.textContent === station ? 0.95 : 0.62);

describe("<StationGlyph> containment", () => {
  it("marks and estimated text extents stay inside the viewBox", () => {
    for (const station of ["KSFO", "WWWWWWWWWWWWWWWWWWWW", "W"]) {
      for (const size of [20, 34, 48, 96]) {
        const { container } = draw(<StationGlyph {...OBS} station={station} size={size} />);
        const svg = container.querySelector("svg")!;
        const [, , w, h] = svg.getAttribute("viewBox")!.split(" ").map(Number);
        const where = `${station} @ ${size}`;

        const disc = svg.querySelector("circle")!;
        const [cx, cy, r] = ["cx", "cy", "r"].map((a) => Number(disc.getAttribute(a)));
        expect(cx! - r!, `${where} disc left`).toBeGreaterThanOrEqual(0);
        expect(cx! + r!, `${where} disc right`).toBeLessThanOrEqual(w!);
        expect(cy! - r!, `${where} disc top`).toBeGreaterThanOrEqual(0);
        expect(cy! + r!, `${where} disc bottom`).toBeLessThanOrEqual(h!);

        // Straight-line paths only (barb shaft, feathers, pennants) — their `d`
        // is coordinate pairs. The sky sector's arc carries radii and flags, and
        // it is bounded by the disc above it by construction (same cx/cy/r).
        for (const p of svg.querySelectorAll("path")) {
          const d = p.getAttribute("d")!;
          if (d.includes("A")) continue;
          const n = d.match(/-?\d*\.?\d+/g)!.map(Number);
          for (let i = 0; i < n.length; i += 2) {
            expect(n[i]!, `${where} path x`).toBeGreaterThanOrEqual(0);
            expect(n[i]!, `${where} path x`).toBeLessThanOrEqual(w!);
            expect(n[i + 1]!, `${where} path y`).toBeGreaterThanOrEqual(0);
            expect(n[i + 1]!, `${where} path y`).toBeLessThanOrEqual(h!);
          }
        }

        for (const t of svg.querySelectorAll("text")) {
          const x = Number(t.getAttribute("x"));
          const y = Number(t.getAttribute("y"));
          const fs = Number(t.getAttribute("font-size"));
          const run = t.textContent!.length * rate(t, station) * fs;
          const end = t.getAttribute("text-anchor") === "end";
          expect(end ? x - run : x, `${where} text left`).toBeGreaterThanOrEqual(0);
          expect(end ? x : x + run, `${where} text right`).toBeLessThanOrEqual(w!);
          // dominant-baseline: central — the em box straddles y
          expect(y - fs * 0.5, `${where} text top`).toBeGreaterThanOrEqual(0);
          expect(y + fs * 0.5, `${where} text bottom`).toBeLessThanOrEqual(h!);
        }
      }
    }
  });

  it("a long station id widens the box instead of painting outside it", () => {
    const box = (station: string) =>
      draw(<StationGlyph {...OBS} station={station} size={48} />)
        .container.querySelector("svg")!
        .getAttribute("viewBox")!;
    // An ordinary ICAO id fits the numeral gutters and changes nothing.
    expect(box("KSFO")).toBe(box("KJFK"));
    expect(Number(box("WWWWWWWWWWWWWWWWWWWW").split(" ")[2])).toBeGreaterThan(
      Number(box("KSFO").split(" ")[2]),
    );
  });
});

valueEdgeSuite("StationGlyph", (value: number) => (
  <StationGlyph temp={value} title="Edge" size={34} />
));
