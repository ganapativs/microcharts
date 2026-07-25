import type { ChartModule, PlaygroundSpec } from "./types";
import { PictogramRow } from "@microcharts/react/pictogram-row";
import { PictogramRow as PictogramRowInteractive } from "@microcharts/react/pictogram-row/interactive";
import staticModule, { playground as staticPlayground } from "./pictogram-row";

/** Interactive half of the pictogram-row chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./pictogram-row`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <PictogramRowInteractive value={5} total={8} summary={false} width={110} height={16} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => {
    const total = s.total as number;
    const value = Math.min(s.value as number, total);
    return (
      <PictogramRowInteractive
        value={value}
        total={total}
        shape={s.shape as "dot" | "square"}
        fractional={s.fractional as "clip" | "round"}
        summary={false}
        animate={ui.animate}
        width={240}
        height={28}
      />
    );
  },
  codeInteractive: (s, _data, ui) => {
    const total = s.total as number;
    const value = Math.min(s.value as number, total);
    return [
      "<PictogramRow",
      `  value={${value}}`,
      `  total={${total}}`,
      s.shape !== "dot" && `  shape="${s.shape}"`,
      s.fractional !== "clip" && `  fractional="${s.fractional}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n");
  },
};

export default {
  ...staticModule,
  Chart: PictogramRow,
  ChartLive: PictogramRowInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
