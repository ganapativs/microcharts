import type { ChartModule, PlaygroundSpec } from "./types";
import { ActivityGrid as ActivityGridInteractive } from "@microcharts/react/activity-grid/interactive";
import staticModule, {
  entry,
  playground as staticPlayground,
  ALIGN_DATE,
  DOMAIN,
} from "./activity-grid";

/** Interactive half of the activity-grid chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./activity-grid`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <ActivityGridInteractive data={entry.demo} cell={10} summary={false} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, data, ui) => (
    <ActivityGridInteractive
      data={data}
      layout={s.layout as "grid" | "strip"}
      shape={s.shape as "square" | "round" | "dot"}
      cell={Number(s.cell)}
      start={s.align !== "none" ? ALIGN_DATE : undefined}
      weekStart={s.align === "sunday" ? 0 : 1}
      domain={s.domain ? DOMAIN : undefined}
      animate={ui.animate}
      title="Playground"
    />
  ),
  codeInteractive: (s, data, ui) =>
    [
      "<ActivityGrid",
      `  data={/* ${data.length} values */}`,
      `  layout="${s.layout}"`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      `  cell={${s.cell}}`,
      s.align !== "none" && `  start="${ALIGN_DATE}"`,
      s.align === "sunday" && "  weekStart={0}",
      s.domain && "  domain={[0, 6]}",
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
