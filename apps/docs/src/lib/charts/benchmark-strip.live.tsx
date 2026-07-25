import type { ChartModule, PlaygroundSpec } from "./types";
import { BenchmarkStrip } from "@microcharts/react/benchmark-strip";
import { BenchmarkStrip as BenchmarkStripInteractive } from "@microcharts/react/benchmark-strip/interactive";
import staticModule, { playground as staticPlayground, PEERS } from "./benchmark-strip";

/** Interactive half of the benchmark-strip chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./benchmark-strip`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <BenchmarkStripInteractive
      data={PEERS}
      value={312}
      summary={false}
      width={140}
      height={14}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, data, ui) => (
    <BenchmarkStripInteractive
      data={data}
      value={s.value as number}
      range={s.range as "p5p95" | "minmax"}
      label={s.label as "percentile" | "value" | "none"}
      summary={false}
      animate={ui.animate}
      width={280}
      height={16}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<BenchmarkStrip",
      "  data={peerLatencies}",
      `  value={${s.value}}`,
      s.range !== "p5p95" && `  range="${s.range}"`,
      s.label !== "percentile" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: BenchmarkStrip,
  ChartLive: BenchmarkStripInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
