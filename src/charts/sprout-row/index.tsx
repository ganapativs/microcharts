// <SproutRow> — how mature/healthy is each item in a small set (S2 ordinal).
// Four discrete growth stages (seed → sprout → leaf → bloom); glyph
// height is strictly monotonic so the ordering reads untrained (taller = further
// along). No half-stages — a growth metaphor must not fake continuity. Static,
// hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_SPROUT, type SproutStrings } from "../../core/strings-sprout.js";
import { labelFont, labelFitsY, textGutterProse } from "../../core/labels.js";
import { sproutRowGeometry, stageGlyph } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";
import { maxOf } from "../../core/scale.js";

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

/**
 * The label-driven layout numbers (they widen the row when category names are
 * shown). Exported because the interactive entry must derive the SAME
 * step/padX/labelBand — computing them independently drifted its overlay ring
 * off the glyph whenever `labels` was on.
 *
 * Category labels render at the library-standard size and never shrink to an
 * illegible caption. To keep the row compact they STAGGER onto two tiers below
 * the soil (even slots near, odd slots far), so same-tier neighbours sit two
 * steps apart — a name only needs to clear 2·step, not one. The extent is the
 * shared PROSE estimate (`textGutterProse`, 0.95 em/char) plus a half-em gutter:
 * these are caller names, not figures this chart formatted, and the digits rate
 * it used to assume (0.72) is under the measured advance of an upper-case name,
 * which put "FOXTROT" on top of its neighbour and past the row's edge. The row
 * still widens if even 2·step is too tight.
 */
export function sproutLayout(
  data: readonly SproutDatum[],
  labels: boolean,
  fontSize: number,
  step?: number | undefined,
): { step: number; padX: number; labelBand: number; twoTier: boolean } {
  const catExtent = labels
    ? maxOf(
        data.map((d) => textGutterProse(d.label.length, fontSize, fontSize * 0.5)),
        0,
      )
    : 0;
  const s = Math.max(step ?? 16, Math.ceil(catExtent / 2));
  // Side gutter so the outermost name (half its extent past its centre) never
  // clips the viewBox edge.
  const padX = labels ? Math.max(PAD, Math.ceil(catExtent / 2 - s / 2)) : PAD;
  const twoTier = labels && data.length > 1;
  // Two label lines below the soil (+1px gap each) when a second tier is used.
  const labelBand = labels ? fontSize + 1 + (twoTier ? fontSize + 1 : 0) : 0;
  return { step: s, padX, labelBand, twoTier };
}

/**
 * Is there room for the category names? Shared by both entries so the static and
 * the interactive twin never disagree about the label band — a client that kept
 * a gutter the static dropped would walk every hit-test sideways by its width.
 */
export function sproutLabelsFit(
  data: readonly SproutDatum[],
  fontSize: number,
  height: number,
  step?: number | undefined,
): boolean {
  const { labelBand } = sproutLayout(data, true, fontSize, step);
  return height - labelBand >= fontSize + PAD * 2;
}

export function SproutRow(props: SproutRowProps): ReactNode {
  const {
    data,
    labels = false,
    label = "none",
    color,
    // Labels stagger onto two tiers below the soil, so the default row is taller
    // when names are shown (glyphs still get the upper half).
    height = labels ? 40 : 20,
    strings = EN_SPROUT,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;
  const fontSize = props.fontSize ?? labelFont(height, 0.3);
  // A name costs a band below the soil; keep it only while the glyph still has
  // room to grow above that band. Under it the row would be all text and no
  // sprout, with the names spilling out of the box — so they drop, and the band
  // and side gutter drop with them (the plot itself never reflows).
  const showLabels = labels && sproutLabelsFit(data, fontSize, height, props.step);
  // The stage numeral sits above the glyph on a text baseline; drop it once its
  // descender would clear the box floor.
  const showValue = label === "value" && labelFitsY(PAD + fontSize, fontSize, height, false);
  const { step, padX, labelBand, twoTier } = sproutLayout(data, showLabels, fontSize, props.step);

  const geo = sproutRowGeometry({
    stages: data.map((d) => d.value),
    height,
    step,
    pad: PAD,
    padX,
    bottomReserve: labelBand,
  });
  const accName = resolveSummary(summary, () => sproutRowSummary(data, strings));
  const paint = color;

  return (
    <Chart
      width={geo.width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Every glyph grows UP from the soil, so the soil is the floor and it
      // belongs on the text baseline like the foot of a letter. Seat the soil,
      // not the viewBox: the category names occupy a reserved band below it, and
      // seating the whole box would sink the plants by that band's height.
      seat={{ mode: "floor", bottom: geo.soil.y1 }}
      className={className ? `mc-sprout ${className}` : "mc-sprout"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      <line
        x1={geo.soil.x1}
        y1={geo.soil.y1}
        x2={geo.soil.x2}
        y2={geo.soil.y2}
        data-mc-ink="muted"
        strokeOpacity={0.6}
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
      {showValue
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
      {showLabels
        ? geo.slots.map((s, i) => {
            // Even slots sit on the near tier, odd on the far tier — each name
            // stays centred under its own glyph, so the column mapping is exact.
            const far = twoTier && i % 2 === 1;
            const y = s.baselineY + fontSize + 1 + (far ? fontSize + 1 : 0);
            return (
              <text
                key={`l${s.x}`}
                x={s.x}
                y={y}
                fontSize={fontSize}
                textAnchor="middle"
                data-mc-ink="label"
              >
                {data[i]!.label}
              </text>
            );
          })
        : null}
      {children}
    </Chart>
  );
}
