import type { ChartModule, PlaygroundSpec } from "./types";
import { EnsembleGhosts } from "@microcharts/react/ensemble-ghosts";
import { EnsembleGhosts as EnsembleGhostsInteractive } from "@microcharts/react/ensemble-ghosts/interactive";
import staticModule, { playground as staticPlayground, FUTURES } from "./ensemble-ghosts";

/** Interactive half of the ensemble-ghosts chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./ensemble-ghosts`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <EnsembleGhostsInteractive data={FUTURES} summary={false} width={120} height={28} animate />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <EnsembleGhostsInteractive
      data={FUTURES}
      ghosts={s.ghosts as number}
      emphasis={s.emphasis as "nearest-median" | "median"}
      endpoints={s.endpoints as boolean}
      label={s.label as "end" | "none"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<EnsembleGhosts",
      "  data={futures}",
      s.ghosts !== 8 && `  ghosts={${s.ghosts}}`,
      s.emphasis !== "nearest-median" && `  emphasis="${s.emphasis}"`,
      s.endpoints && "  endpoints",
      s.label !== "end" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: EnsembleGhosts,
  ChartLive: EnsembleGhostsInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
