import type { ChartModule, PlaygroundSpec } from "./types";
import { StatusDot } from "@microcharts/react/status-dot";
import { StatusDot as StatusDotInteractive } from "@microcharts/react/status-dot/interactive";
import staticModule, { playground as staticPlayground } from "./status-dot";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      {(["ok", "warn", "error", "off", "busy"] as const).map((s) => (
        <StatusDotInteractive
          key={s}
          status={s}
          summary={false}
          style={{ width: 14, height: 14 }}
          animate={animate}
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
      title="Service state"
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
  Chart: StatusDot,
  ChartLive: StatusDotInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
