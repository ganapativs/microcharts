import type { ChartModule, PlaygroundSpec } from "./types";
import { ForecastCone } from "@microcharts/react/forecast-cone";
import { ForecastCone as ForecastConeInteractive } from "@microcharts/react/forecast-cone/interactive";
import staticModule, { playground as staticPlayground, HIST, FORE } from "./forecast-cone";

/** Interactive half of the forecast-cone chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./forecast-cone`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <ForecastConeInteractive
      data={HIST}
      forecast={FORE}
      summary={false}
      width={150}
      height={24}
      animate
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <ForecastConeInteractive
      data={HIST}
      forecast={s.p50 ? FORE : { mid: FORE.mid, p80: FORE.p80 }}
      target={s.target ? 45 : undefined}
      label={s.label as "landing" | "none"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ForecastCone",
      "  data={history}",
      "  forecast={forecast}",
      s.target && "  target={45}",
      s.label !== "landing" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: ForecastCone,
  ChartLive: ForecastConeInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
