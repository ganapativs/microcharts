import type { ChartModule, PlaygroundSpec } from "./types";
import { MiniBar } from "@microcharts/react/mini-bar";
import { MiniBar as MiniBarInteractive } from "@microcharts/react/mini-bar/interactive";
import staticModule, { playground as staticPlayground, MIX, SIGNED } from "./mini-bar";

/** Interactive half of the mini-bar chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./mini-bar`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <MiniBarInteractive data={MIX} summary={false} width={100} height={32} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => {
    const signed = s.positive as boolean;
    const rows = signed ? SIGNED : MIX;
    return (
      <MiniBarInteractive
        data={rows}
        order={s.order as "data" | "desc" | "asc"}
        highlight={(s.highlight as boolean) ? rows[0]!.label : undefined}
        orientation={s.orientation as "horizontal" | "vertical"}
        positive={signed ? "up" : undefined}
        label={s.label as "none" | "max"}
        animate={ui.animate}
        summary={false}
        width={160}
        height={s.orientation === "horizontal" ? 96 : 52}
      />
    );
  },
  codeInteractive: (s, _data, ui) => {
    const signed = s.positive as boolean;
    const varName = signed ? "signed" : "regions";
    const target = signed ? "Mon" : "East";
    return [
      "<MiniBar",
      `  data={${varName}}`,
      s.order !== "data" && `  order="${s.order}"`,
      (s.highlight as boolean) && `  highlight="${target}"`,
      s.orientation === "horizontal" && '  orientation="horizontal"',
      signed && '  positive="up"',
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n");
  },
};

export default {
  ...staticModule,
  Chart: MiniBar,
  ChartLive: MiniBarInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
