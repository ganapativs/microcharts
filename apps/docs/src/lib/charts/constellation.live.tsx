import type { ChartModule, PlaygroundSpec } from "./types";
import { Constellation as ConstellationInteractive } from "@microcharts/react/constellation/interactive";
import staticModule, { playground as staticPlayground, INCIDENTS } from "./constellation";

/** Interactive half of the constellation chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./constellation`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <ConstellationInteractive data={INCIDENTS} summary={false} width={90} height={26} animate />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <ConstellationInteractive
      data={[
        { x: 0, y: 40, m: 2 },
        { x: 2, y: s.spike as number, m: 7 },
        { x: 5, y: 30, m: 3 },
        { x: 8, y: 65, m: 5 },
      ]}
      connect={s.connect === "on"}
      label={s.label as "none" | "max"}
      animate={ui.animate}
      summary={false}
      width={140}
      height={44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Constellation",
      "  data={events}",
      s.connect !== "on" && "  connect={false}",
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  PreviewLive,
  playground,
} satisfies ChartModule;
