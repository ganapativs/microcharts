import type { ChartModule, PlaygroundSpec } from "./types";
import { TraceFold as TraceFoldInteractive } from "@microcharts/react/trace-fold/interactive";
import staticModule, { playground as staticPlayground, TRACE, ms } from "./trace-fold";

/** Interactive half of the trace-fold chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./trace-fold`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <TraceFoldInteractive
      data={TRACE}
      format={ms}
      summary={false}
      width={180}
      height={48}
      animate
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <TraceFoldInteractive
      data={TRACE}
      emphasis={s.emphasis as "critical" | "none"}
      labels={s.labels as boolean}
      format={ms}
      animate={ui.animate}
      summary={false}
      width={320}
      height={48}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<TraceFold",
      "  data={spans}",
      s.emphasis !== "critical" && `  emphasis="${s.emphasis}"`,
      s.labels === false && "  labels={false}",
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
