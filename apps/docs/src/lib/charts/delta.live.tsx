import type { ChartModule, PlaygroundSpec } from "./types";
import { Delta } from "@microcharts/react/delta";
import { Delta as DeltaInteractive } from "@microcharts/react/delta/interactive";
import staticModule, { playground as staticPlayground } from "./delta";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  // Same type-scale wrapper the static `Preview` uses — the gallery swaps one
  // for the other in place, so a different font size is a visible jump.
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
    // Chart is the root so playground callback injection lands on Delta — not a
    // sizing wrapper. Type scale via style (inherits into the glyph + figure) —
    // `lineHeight` included because the static render gets both from `text-3xl`,
    // and a bare font-size left the interactive line box 6px shorter.
    const style = { fontSize: "1.875rem", lineHeight: "2.25rem" };
    if (mode === "from prior") {
      return (
        <DeltaInteractive
          value={100 + pct}
          from={100}
          positive={positive}
          locale={locale}
          animate={ui.animate}
          style={style}
        />
      );
    }
    if (mode === "currency") {
      return (
        <DeltaInteractive
          value={pct * 1000}
          format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
          positive={positive}
          locale={locale}
          animate={ui.animate}
          style={style}
        />
      );
    }
    return (
      <DeltaInteractive
        value={pct / 100}
        positive={positive}
        locale={locale}
        animate={ui.animate}
        style={style}
      />
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
