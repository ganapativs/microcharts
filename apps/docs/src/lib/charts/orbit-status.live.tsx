import type { ChartModule, PlaygroundSpec } from "./types";
import { OrbitStatus as OrbitStatusInteractive } from "@microcharts/react/orbit-status/interactive";
import staticModule, { playground as staticPlayground, LD, RD } from "./orbit-status";

/** Interactive half of the orbit-status chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./orbit-status`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <OrbitStatusInteractive
      latency={240}
      rate={12}
      latencyDomain={LD}
      rateDomain={RD}
      summary={false}
      size={24}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s) => (
    <OrbitStatusInteractive
      latency={s.latency as number}
      rate={s.rate as number}
      latencyDomain={LD}
      rateDomain={RD}
      alert={s.alert === "on" ? 300 : undefined}
      summary={false}
      size={120}
    />
  ),
  codeInteractive: (s) =>
    [
      "<OrbitStatus",
      `  latency={${s.latency}}`,
      `  rate={${s.rate}}`,
      "  latencyDomain={[0, 500]}",
      "  rateDomain={[0, 20]}",
      s.alert === "on" && "  alert={300}",
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
