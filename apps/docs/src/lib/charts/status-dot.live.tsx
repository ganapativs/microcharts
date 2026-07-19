import type { ChartModule, PlaygroundSpec } from "./types";
import { StatusDot as StatusDotInteractive } from "@microcharts/react/status-dot/interactive";
import staticModule, { playground as staticPlayground } from "./status-dot";

/** Interactive half of the status-dot chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./status-dot`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <span className="inline-flex items-center gap-3">
      {(["ok", "warn", "error", "off", "busy"] as const).map((s) => (
        <StatusDotInteractive
          key={s}
          status={s}
          summary={false}
          style={{ width: 14, height: 14 }}
          animate
        />
      ))}
    </span>
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <StatusDotInteractive
      status={s.status as string}
      pulse={s.pulse as boolean}
      summary={false}
      animate={ui.animate}
      style={{ width: 40, height: 40 }}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<StatusDot",
      `  status="${s.status}"`,
      (s.pulse as boolean) && "  pulse",
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
