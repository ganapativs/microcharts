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
});

valueEdgeSuite("StationGlyph", (value: number) => (
  <StationGlyph temp={value} title="Edge" size={34} />
));
