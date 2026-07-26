import type { ChartModule, PlaygroundSpec } from "./types";
import { Bullet } from "@microcharts/react/bullet";
import { Bullet as BulletInteractive } from "@microcharts/react/bullet/interactive";
import staticModule, { playground as staticPlayground } from "./bullet";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <BulletInteractive
      value={72}
      target={80}
      bands={[50, 90]}
      width={190}
      height={22}
      summary={false}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <BulletInteractive
      value={s.value as number}
      target={s.target as number}
      bands={s.bands ? [50, 90] : undefined}
      domain={s.domain ? [0, 60] : undefined}
      label={s.label as "none" | "value" | "target" | "both"}
      animate={ui.animate}
      width={300}
      height={28}
      className="w-full max-w-md"
      title="Quota attainment"
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Bullet",
      `  value={${s.value}}`,
      `  target={${s.target}}`,
      s.bands && "  bands={[50, 90]}",
      s.domain && "  domain={[0, 60]}",
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Bullet,
  ChartLive: BulletInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
