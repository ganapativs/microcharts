import type { ChartModule, PlaygroundSpec } from "./types";
import { FillWord } from "@microcharts/react/fill-word";
import { FillWord as FillWordInteractive } from "@microcharts/react/fill-word/interactive";
import staticModule, { playground as staticPlayground } from "./fill-word";

/** Interactive half of the fill-word chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./fill-word`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <span className="inline-flex items-center gap-4">
      <FillWordInteractive word="uploading" value={0.62} summary={false} fontSize={13} animate />
      <FillWord word="expiring" value={0.7} mode="drain" summary={false} fontSize={13} />
    </span>
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <FillWordInteractive
      word={s.mode === "drain" ? "expiring" : "uploading"}
      value={(s.value as number) / 100}
      mode={s.mode as "fill" | "drain"}
      label={s.label ? "value" : "none"}
      summary={false}
      animate={ui.animate}
      fontSize={18}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<FillWord",
      `  word="${s.mode === "drain" ? "expiring" : "uploading"}"`,
      `  value={${((s.value as number) / 100).toFixed(2)}}`,
      s.mode !== "fill" && `  mode="${s.mode}"`,
      s.label && '  label="value"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: FillWord,
  ChartLive: FillWordInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
