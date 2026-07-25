import type { ChartModule, PlaygroundSpec } from "./types";
import { Delta } from "@microcharts/react/delta";
import { Delta as DeltaInteractive } from "@microcharts/react/delta/interactive";
import staticModule, { playground as staticPlayground } from "./delta";

/** Interactive half of the delta chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./delta`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <span className="text-2xl">
      <DeltaInteractive value={0.184} summary={false} animate={animate} />
    </span>
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => {
    const pct = s.pct as number;
    const positive = s.positive as "up" | "down";
    const mode = s.mode as string;
    const locale = s.locale as string;
    if (mode === "from prior") {
      return (
        <span className="text-3xl">
          <DeltaInteractive
            value={100 + pct}
            from={100}
            positive={positive}
            locale={locale}
            summary={false}
            animate={ui.animate}
          />
        </span>
      );
    }
    if (mode === "currency") {
      return (
        <span className="text-3xl">
          <DeltaInteractive
            value={pct * 1000}
            format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
            positive={positive}
            locale={locale}
            summary={false}
            animate={ui.animate}
          />
        </span>
      );
    }
    return (
      <span className="text-3xl">
        <DeltaInteractive
          value={pct / 100}
          positive={positive}
          locale={locale}
          summary={false}
          animate={ui.animate}
        />
      </span>
    );
  },
  codeInteractive: (s, _data, ui) => {
    const pct = s.pct as number;
    const positive = s.positive as "up" | "down";
    const mode = s.mode as string;
    const locale = s.locale as string;
    const lines = ["<Delta"];
    if (mode === "from prior") {
      lines.push(`  value={${100 + pct}}`, "  from={100}");
    } else if (mode === "currency") {
      lines.push(
        `  value={${pct * 1000}}`,
        '  format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}',
      );
    } else {
      lines.push(`  value={${(pct / 100).toFixed(2)}}`);
    }
    if (positive === "down") lines.push('  positive="down"');
    if (locale !== "en-US") lines.push(`  locale="${locale}"`);
    if (ui.animate) lines.push(" animate");
    lines.push("/>");
    return lines.join("\n");
  },
};

export default {
  ...staticModule,
  Chart: Delta,
  ChartLive: DeltaInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
