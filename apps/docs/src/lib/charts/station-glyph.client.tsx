"use client";
import { StationGlyph as StationGlyphInteractive } from "@microcharts/react/station-glyph/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { OBS } from "./station-glyph";

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Focus the glyph and use ←/→ to step through each field — station, wind, sky, temperature, dew point, pressure — announced one at a time. Home reads the whole observation.">
      <StationGlyphInteractive {...OBS} title="KSFO observation" size={48} />
    </DemoPanel>
  );
}
