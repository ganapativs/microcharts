import type { ChartModule, PlaygroundSpec } from "./types";
import { DicePips } from "@microcharts/react/dice-pips";
import { DicePips as DicePipsInteractive } from "@microcharts/react/dice-pips/interactive";
import staticModule, { playground as staticPlayground } from "./dice-pips";

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
      title="Severity"
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
  Chart: DicePips,
  ChartLive: DicePipsInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
