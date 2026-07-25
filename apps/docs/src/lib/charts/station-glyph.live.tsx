import type { ChartModule, PlaygroundSpec } from "./types";
import { StationGlyph } from "@microcharts/react/station-glyph";
import { StationGlyph as StationGlyphInteractive } from "@microcharts/react/station-glyph/interactive";
import staticModule, { playground as staticPlayground, OBS } from "./station-glyph";

/** Interactive half of the station-glyph chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./station-glyph`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <StationGlyphInteractive {...OBS} summary={false} size={48} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <StationGlyphInteractive
      station="KSFO"
      cloud={s.cloud as number}
      wind={{ direction: s.direction as number, magnitude: s.magnitude as number }}
      temp={16}
      dewpoint={9}
      pressure={1013}
      summary={false}
      animate={ui.animate}
      size={44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<StationGlyph",
      '  station="KSFO"',
      `  cloud={${s.cloud}}`,
      `  wind={{ direction: ${s.direction}, magnitude: ${s.magnitude} }}`,
      "  temp={16}",
      "  dewpoint={9}",
      "  pressure={1013}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: StationGlyph,
  ChartLive: StationGlyphInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
