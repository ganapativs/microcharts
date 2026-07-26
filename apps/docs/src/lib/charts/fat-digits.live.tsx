import type { ChartModule, PlaygroundSpec } from "./types";
import { FatDigits } from "@microcharts/react/fat-digits";
import { FatDigits as FatDigitsInteractive } from "@microcharts/react/fat-digits/interactive";
import staticModule, { playground as staticPlayground, COLUMN, DOMAIN } from "./fat-digits";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <span className="inline-flex flex-col items-end gap-1 tabular-nums">
      {COLUMN.map((v) => (
        <FatDigitsInteractive
          key={v}
          value={v}
          domain={DOMAIN}
          summary={false}
          fontSize={14}
          animate={animate}
        />
      ))}
    </span>
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <FatDigitsInteractive
      value={s.value as number}
      domain={DOMAIN}
      encode={s.encode as "value" | "digit"}
      tiers={Number(s.tiers) as 3 | 5}
      title="Revenue"
      animate={ui.animate}
      fontSize={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<FatDigits",
      `  value={${s.value}}`,
      "  domain={[0, 2100]}",
      s.encode !== "value" && `  encode="${s.encode}"`,
      s.tiers !== "5" && `  tiers={${s.tiers}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: FatDigits,
  ChartLive: FatDigitsInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
