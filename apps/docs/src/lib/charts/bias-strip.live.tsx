import type { ChartModule, PlaygroundSpec } from "./types";
import { BiasStrip as BiasStripInteractive } from "@microcharts/react/bias-strip/interactive";
import staticModule, { playground as staticPlayground, PAIRS } from "./bias-strip";

/** Interactive half of the bias-strip chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./bias-strip`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <BiasStripInteractive data={PAIRS} summary={false} width={120} height={64} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <BiasStripInteractive
      data={PAIRS}
      limits={(s.wide as boolean) ? 2.58 : 1.96}
      label={(s.caption as boolean) ? "bias" : "none"}
      r={s.r as number}
      summary={false}
      animate={ui.animate}
      width={220}
      height={120}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<BiasStrip",
      "  data={pairs}",
      (s.wide as boolean) && "  limits={2.58}",
      !(s.caption as boolean) && '  label="none"',
      s.r !== 1.5 && `  r={${s.r}}`,
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
