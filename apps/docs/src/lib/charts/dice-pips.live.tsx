import type { ChartModule, PlaygroundSpec } from "./types";
import { DicePips as DicePipsInteractive } from "@microcharts/react/dice-pips/interactive";
import staticModule, { playground as staticPlayground } from "./dice-pips";

/** Interactive half of the dice-pips chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./dice-pips`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <span className="inline-flex items-center gap-3">
      {[1, 2, 3, 4, 5, 6].map((v) => (
        <DicePipsInteractive key={v} value={v} summary={false} size={18} />
      ))}
    </span>
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s) => (
    <DicePipsInteractive
      value={s.value as number}
      face={s.face as boolean}
      summary={false}
      size={44}
    />
  ),
  codeInteractive: (s) =>
    ["<DicePips", `  value={${s.value}}`, s.face === false && "  face={false}", "/>"]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  PreviewLive,
  playground,
} satisfies ChartModule;
