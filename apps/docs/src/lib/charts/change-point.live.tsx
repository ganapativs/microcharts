import type { ChartModule, PlaygroundSpec } from "./types";
import { ChangePoint as ChangePointInteractive } from "@microcharts/react/change-point/interactive";
import staticModule, { playground as staticPlayground, ERRORS, RAMP } from "./change-point";

/** Interactive half of the change-point chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./change-point`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <ChangePointInteractive data={ERRORS} summary={false} width={120} height={16} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <ChangePointInteractive
      data={s.preset === "ramp" ? RAMP : ERRORS}
      maxItems={s.maxItems as number}
      means={s.means as boolean}
      label={s.delta ? "delta" : "none"}
      title="Error rate"
      animate={ui.animate}
      summary={false}
      width={280}
      height={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ChangePoint",
      "  data={errors}",
      s.maxItems !== 2 && `  maxItems={${s.maxItems}}`,
      s.means === false && "  means={false}",
      s.delta && '  label="delta"',
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
