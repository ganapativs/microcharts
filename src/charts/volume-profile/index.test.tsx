import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { VolumeProfile, volumeProfileSummary } from "./index.js";
import { volumeProfileGeometry } from "./geometry.js";
import { EN_VOLUME_PROFILE } from "../../core/strings-volume-profile.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);
const PROFILE = [
  { level: 138, weight: 8 },
  { level: 140, weight: 14 },
  { level: 142, weight: 25 },
  { level: 144, weight: 13 },
  { level: 146, weight: 7 },
];

describe("<VolumeProfile> (plan/25 §16, plan/17 F15)", () => {
  it("renders bars + POC accent; docs-as-tests summary", () => {
    const { container } = draw(<VolumeProfile data={PROFILE} bins={5} width={80} height={40} />);
    expect(container.querySelector('path[data-mc-ink="bar"]')).not.toBeNull();
    const geo = volumeProfileGeometry({
      data: PROFILE,
      bins: 5,
      valueArea: 0.7,
      align: "left",
      width: 80,
      height: 40,
      gutter: 12,
    });
    expect(volumeProfileSummary(geo, 0.7, EN_VOLUME_PROFILE, fmt)).toBe(
      "Activity concentrates at 142 (POC); 70% within 140.4–143.6.",
    );
  });

  it("POC label renders the modal level", () => {
    const { container } = draw(<VolumeProfile data={PROFILE} bins={5} width={80} height={40} />);
    expect([...container.querySelectorAll("text")].some((t) => t.textContent === "142")).toBe(true);
  });

  it("even distribution → evenly-spread summary", () => {
    const flat = Array.from({ length: 6 }, (_, i) => ({ level: 100 + i * 2, weight: 10 }));
    const geo = volumeProfileGeometry({
      data: flat,
      bins: 6,
      valueArea: 0.7,
      align: "left",
      width: 48,
      height: 32,
      gutter: 0,
    });
    expect(volumeProfileSummary(geo, 0.7, EN_VOLUME_PROFILE, fmt)).toBe(
      "Activity is evenly spread.",
    );
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <VolumeProfile data={PROFILE} bins={5} title="Volume by price" width={80} height={40} />,
    );
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("VolumeProfile", (data: readonly Value[]) => (
  <VolumeProfile data={data as readonly number[]} title="Edge" width={48} height={32} />
));
