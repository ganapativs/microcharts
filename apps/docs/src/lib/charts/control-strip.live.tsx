import type { ChartModule, PlaygroundSpec } from "./types";
import { ControlStrip as ControlStripInteractive } from "@microcharts/react/control-strip/interactive";
import staticModule, { playground as staticPlayground, DEMO } from "./control-strip";

/** Interactive half of the control-strip chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./control-strip`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <ControlStripInteractive data={DEMO} summary={false} width={150} height={22} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <ControlStripInteractive
      data={DEMO}
      limits={s.limits as "sigma" | "percentile"}
      rules={s.rules ? "we" : "none"}
      dots={s.dots ? "all" : "out"}
      summary={false}
      animate={ui.animate}
      width={280}
      height={26}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ControlStrip",
      "  data={weights}",
      s.limits !== "sigma" && `  limits="${s.limits}"`,
      s.rules && '  rules="we"',
      s.dots && '  dots="all"',
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
