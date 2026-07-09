// <SproutRow> — how mature/healthy is each item in a small set (plan/24 #9, S2
// ordinal). Four discrete growth stages (seed → sprout → leaf → bloom); glyph
// height is strictly monotonic so the ordering reads untrained (taller = further
// along). No half-stages — a growth metaphor must not fake continuity. Static,
// hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_SPROUT, type SproutStrings } from "../../core/strings-sprout.js";
import { sproutRowGeometry, stageGlyph } from "./geometry.js";

export interface SproutDatum {
  label: string;
  /** Stage 0–3 (rounded + clamped); null = missing (soil tick only). */
  value: number | null;
}

export interface SproutRowProps {
  data: readonly SproutDatum[];
  /** Category labels under the slots (default off at micro scale). */
  labels?: boolean | undefined;
  /** `value` prints the stage number above each glyph. */
  label?: "none" | "value" | undefined;
  color?: string | undefined;
  height?: number | undefined;
  step?: number | undefined;
  fontSize?: number | undefined;
  strings?: SproutStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 2;

export function sproutRowSummary(
  data: readonly SproutDatum[],
  strings: SproutStrings = EN_SPROUT,
): string {
  const stages = data.map((d) =>
    d.value === null || !Number.isFinite(d.value)
      ? null
      : Math.max(0, Math.min(3, Math.round(d.value))),
  );
  const bloom = stages.filter((s) => s === 3).length;
  const seed = stages.filter((s) => s === 0).length;
  return strings.sproutRow(data.length, bloom, seed);
}

export function SproutRow(props: SproutRowProps): ReactNode {
  const {
    data,
    labels = false,
    label = "none",
    color,
    height = 20,
    step = 16,
    fontSize = 6,
    strings = EN_SPROUT,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const geo = sproutRowGeometry({
    stages: data.map((d) => d.value),
    height,
    step,
    pad: PAD,
    bottomReserve: labels ? fontSize + 1 : 0,
  });
  const accName = summary === false ? false : (summary ?? sproutRowSummary(data, strings));
  const paint = color;

  return (
    <Chart
      width={geo.width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-sprout ${className}` : "mc-sprout"}
      style={{ "--mc-label-size": `${fontSize}px`, ...style } as CSSProperties}
    >
      {/* soil */}
      <line
        x1={geo.soil.x1}
        y1={geo.soil.y1}
        x2={geo.soil.x2}
        y2={geo.soil.y2}
        data-mc-ink="muted"
        style={{ strokeOpacity: 0.6 }}
      />
      {geo.slots.map((s) =>
        s.stage === null ? null : (
          <path
            key={`g${s.x}`}
            d={stageGlyph(s.stage, s.x, s.baselineY, s.baselineY - PAD)}
            data-mc-ink="point"
            style={paint ? { fill: paint } : undefined}
          />
        ),
      )}
      {label === "value"
        ? geo.slots.map((s) =>
            s.stage === null ? null : (
              <text
                key={`v${s.x}`}
                x={s.x}
                y={PAD + fontSize}
                fontSize={fontSize}
                textAnchor="middle"
                data-mc-ink="label"
              >
                {s.stage}
              </text>
            ),
          )
        : null}
      {labels
        ? geo.slots.map((s, i) => {
            const text = data[i]!.label;
            // drop a category label that would collide with its neighbour (plan/18 §4)
            if (text.length * 0.62 * fontSize > step - 1) return null;
            return (
              <text
                key={`l${s.x}`}
                x={s.x}
                y={height - fontSize * 0.42}
                fontSize={fontSize}
                textAnchor="middle"
                data-mc-ink="label"
              >
                {text}
              </text>
            );
          })
        : null}
      {children}
    </Chart>
  );
}
