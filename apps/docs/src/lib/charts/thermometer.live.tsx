import type { ChartModule, PlaygroundSpec } from "./types";
import { Thermometer } from "@microcharts/react/thermometer";
import { Thermometer as ThermometerInteractive } from "@microcharts/react/thermometer/interactive";
import staticModule, { playground as staticPlayground } from "./thermometer";

/** Interactive half of the thermometer chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./thermometer`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <span className="inline-flex items-end gap-3">
      <ThermometerInteractive value={72} target={80} summary={false} animate />
      <ThermometerInteractive value={40} summary={false} animate />
      <ThermometerInteractive value={95} summary={false} animate />
    </span>
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <ThermometerInteractive
      value={s.value as number}
      target={s.target as number}
      orientation={s.orientation as "vertical" | "horizontal"}
      bulb={s.bulb as boolean}
      summary={false}
      animate={ui.animate}
      {...(s.orientation === "horizontal" ? { width: 120 } : { height: 72 })}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Thermometer",
      `  value={${s.value}}`,
      `  target={${s.target}}`,
      s.orientation !== "vertical" && `  orientation="${s.orientation}"`,
      s.bulb === false && "  bulb={false}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Thermometer,
  ChartLive: ThermometerInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
