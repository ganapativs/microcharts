// Annotation layer. Declarative reference context
// — <Threshold> <TargetZone> <Marker> <Callout> — identical inside every host.
// Static-safe by construction: no context, no cloneElement of consumer nodes,
// no generated ids. Each component renders null on its own and carries its
// MARK RENDERER as a static field; hosts walk children with the tiny resolver
// in annotations-host.tsx and call these renderers — so this module's weight
// ships with the consumer's `@microcharts/react/annotations` import, never
// inside a host that renders no annotations. Reference ink whispers: ≤ 0.7
// opacity, the data never competes.
import type { CSSProperties, ReactNode } from "react";
import { devWarn } from "../core/dev.js";
import { seeded } from "../core/jitter.js";
import { round2 } from "../core/types.js";
import { ANNOTATION, type AnnotationBrand } from "./annotations-host.js";

export interface ThresholdProps {
  /** Data-space y of the reference hairline. */
  y: number;
  label?: string | undefined;
  color?: string | undefined;
}

export interface TargetZoneProps {
  /** Data-space `[lo, hi]` band. */
  y: readonly [number, number];
  label?: string | undefined;
  color?: string | undefined;
}

export interface MarkerProps {
  /** Data-space x (index for S1 hosts, category index for S2 — see host docs). */
  x: number;
  label?: string | undefined;
  color?: string | undefined;
  /** One-shot deterministic burst on entrance (milestone crossings only). */
  celebrate?: boolean | undefined;
}

export interface CalloutProps {
  x: number;
  /** Data-space y of the narrated point (defaults to the frame's mid-height). */
  y?: number | undefined;
  label: string;
  color?: string | undefined;
}

function standalone(name: string): null {
  devWarn(`<${name}> renders nothing on its own — place it inside a chart that hosts annotations.`);
  return null;
}

/** Clamp + flag: out-of-frame coords pin to the edge and render at 0.4 opacity
 *  — visibly "off-scale", never silently dropped. */
function pin(v: number, max: number): { v: number; off: boolean } {
  if (!Number.isFinite(v)) return { v: 0, off: true };
  if (v < 0) return { v: 0, off: true };
  if (v > max) return { v: max, off: true };
  return { v: round2(v), off: false };
}

/**
 * The annotation layer's own label size, as a CSS custom property.
 *
 * `annotationFontSize` is what `fit`, `edgeFlip` and every top clamp in this file
 * are computed against — but an SVG `font-size` ATTRIBUTE on `<text>` is inert
 * here: `:where(.mc-root text)` in styles.css sets `font-size` as a CSS
 * declaration, and a declaration outranks a presentation attribute. So the
 * painted size was the HOST's own pinned size — a different number on every
 * host, conditional on an unrelated prop on six of them, and on the three hosts
 * that render no text of their own (PairedBars, ControlStrip, CyclePlot) not a
 * viewBox-relative number at all: the `0.75em` default resolves against the
 * surrounding prose, so the same annotation painted at a different size in a
 * table cell than in a heading. Labels were laid out at one size and painted at
 * another, which makes both the truncation budget and the top clamp wrong.
 *
 * The property is `--mc-label-px`, the same private channel a host pins on
 * itself, set here on the annotation group instead — the nearer ancestor wins,
 * so an annotation keeps its own size inside a host that pins one. A host's
 * `labelSize` prop deliberately does not reach here: it raises the floor on the
 * text the CHART lays out, and this layer runs its own truncation and clamps
 * against `annotationFontSize`.
 *
 * Setting the variable rather than an inline `fontSize` keeps annotation text
 * inside the one cascade that owns in-chart type, so `--mc-density` scaling and
 * the `forced-colors` rules that key off `.mc-root text` still reach it exactly
 * as they reach a chart's own labels. The inert `fontSize` attribute STAYS
 * beside it: the craft gate (`tests/craft/audit.mjs`) and the containment
 * estimators read text extents off raw attributes, and without it they fall back
 * to a hardcoded 10.
 */
function labelSize(fontSize: number): CSSProperties {
  return { "--mc-label-px": `${fontSize}px` } as CSSProperties;
}

/** Label anchor with deterministic edge flip (estChars × 0.31em each side). */
function edgeFlip(
  x: number,
  chars: number,
  fontSize: number,
  width: number,
): "start" | "middle" | "end" {
  const half = chars * fontSize * 0.31;
  if (x - half < 0) return "start";
  if (x + half > width) return "end";
  return "middle";
}

/** Consumer labels are the one text path the containment rule can't place with a
 *  reserved gutter (they're author-supplied, arbitrary length). Truncate with a
 *  trailing "…" only when the label's estimated extent (0.62 viewBox units per
 *  char — the library's over-estimate, matching `edgeFlip`) would overrun the
 *  available horizontal run. Short labels are returned unchanged (byte-identical
 *  output); this only ever engages on a label that would otherwise spill. */
function fit(label: string, fontSize: number, avail: number): string {
  const maxChars = Math.floor(avail / (fontSize * 0.62));
  if (label.length <= maxChars) return label;
  return maxChars <= 1 ? "…" : `${label.slice(0, maxChars - 1)}…`;
}

/**
 * Vertical seat for an annotation label: `dominant-baseline: central` plus a
 * clamp that keeps the whole em-box inside the frame.
 *
 * These labels used to sit on the ALPHABETIC baseline and clamp with
 * `Math.max(fontSize * 0.8, …)` — a 0.78-ascent model, which is what the craft
 * audit and `labelFitsY` assume. Real faces exceed it (a Times ascender is
 * ~0.89em), so the top label painted ~0.1em above the frame: measured at 1.0
 * viewBox unit on every host once the painted size finally matched the laid-out
 * one. `central` makes the box straddle `y` symmetrically, which is the same
 * model `labelFitsY(…, mid = true)` uses, so a half em-box each side is the
 * exact clamp — no per-face tuning, and it is the fix `Sparkline label="minmax"`
 * already landed for the same reason.
 */
function seatY(y: number, fontSize: number, height: number): number {
  const half = fontSize * 0.5;
  return round2(Math.min(Math.max(y, half), Math.max(half, height - half)));
}

type Branded = { [ANNOTATION]: AnnotationBrand };

export function Threshold(_props: ThresholdProps): ReactNode {
  return standalone("Threshold");
}
(Threshold as unknown as Branded)[ANNOTATION] = {
  layer: "over",
  render(raw, frame, key) {
    const p = raw as ThresholdProps;
    const { width, height, fontSize } = frame;
    const { v: y, off } = pin(frame.y(p.y), height);
    return (
      <g key={key} opacity={off ? 0.4 : undefined}>
        <line
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke={p.color ?? "var(--mc-neutral)"}
          strokeOpacity={0.7}
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
          // reference hairline: fixed 1-unit ink, deliberately exempt from --mc-density
          style={{ strokeWidth: 1 }}
        />
        {p.label ? (
          <text
            x={width - 1}
            y={seatY(y - 1.5 - fontSize * 0.3, fontSize, height)}
            fontSize={fontSize}
            style={labelSize(fontSize)}
            textAnchor="end"
            dominantBaseline="central"
            data-mc-ink="label"
          >
            {fit(p.label, fontSize, width - 1)}
          </text>
        ) : null}
      </g>
    );
  },
};

export function TargetZone(_props: TargetZoneProps): ReactNode {
  return standalone("TargetZone");
}
(TargetZone as unknown as Branded)[ANNOTATION] = {
  layer: "under",
  render(raw, frame, key) {
    const p = raw as TargetZoneProps;
    const { width, height, fontSize } = frame;
    const a = pin(frame.y(p.y[0]), height);
    const b = pin(frame.y(p.y[1]), height);
    const top = Math.min(a.v, b.v);
    const h = Math.abs(a.v - b.v);
    return (
      <g key={key} opacity={a.off && b.off ? 0.4 : undefined}>
        <rect
          x={0}
          y={round2(top)}
          width={width}
          height={round2(h)}
          data-mc-ink="band"
          style={p.color ? { fill: p.color } : undefined}
        />
        {p.label ? (
          // Start-anchor at the band's floor. Threshold labels end-anchor above
          // their hairline on the opposite corner — when both share a host they
          // no longer collide mid-band at the same (width-1, midY) point.
          <text
            x={1}
            y={seatY(top + h - fontSize * 0.6, fontSize, height)}
            fontSize={fontSize}
            style={labelSize(fontSize)}
            textAnchor="start"
            dominantBaseline="central"
            data-mc-ink="label"
          >
            {fit(p.label, fontSize, width - 2)}
          </text>
        ) : null}
      </g>
    );
  },
};

export function Marker(_props: MarkerProps): ReactNode {
  return standalone("Marker");
}
(Marker as unknown as Branded)[ANNOTATION] = {
  layer: "over",
  render(raw, frame, key) {
    const p = raw as MarkerProps;
    const { width, height, fontSize } = frame;
    const { v: x, off } = pin(frame.x(p.x), width);
    return (
      <g key={key} opacity={off ? 0.4 : undefined}>
        <line
          x1={x}
          y1={p.label ? fontSize + 1 : 0}
          x2={x}
          y2={height}
          stroke={p.color ?? "var(--mc-neutral)"}
          strokeOpacity={0.7}
          vectorEffect="non-scaling-stroke"
          // reference hairline: fixed 1-unit ink, deliberately exempt from --mc-density
          style={{ strokeWidth: 1 }}
        />
        {p.label
          ? (() => {
              // Marker was the ONE label in this file that never went through
              // `fit()`: a long label at x = 0 start-anchors and then runs the
              // whole width and out of the frame, with no truncation and no
              // gutter to stop it (the others all truncate). The run available
              // depends on the anchor `edgeFlip` picked, so resolve that first.
              // A `middle` anchor needs no bound: that is precisely the case
              // `edgeFlip` returns when the centred label already fits, and
              // second-guessing it here truncated a one-character label sitting
              // near the left edge down to a bare ellipsis.
              const anchor = edgeFlip(x, p.label.length, fontSize, width);
              const avail = anchor === "start" ? width - x : anchor === "end" ? x : width;
              return (
                <text
                  x={x}
                  y={seatY(fontSize * 0.5, fontSize, height)}
                  fontSize={fontSize}
                  style={labelSize(fontSize)}
                  textAnchor={anchor}
                  dominantBaseline="central"
                  data-mc-ink="label"
                >
                  {fit(p.label, fontSize, avail - 1)}
                </text>
              );
            })()
          : null}
        {p.celebrate
          ? (() => {
              // 6 deterministic particles seeded by x + host size — never
              // Math.random (SSR/visual-test stable). Rendered AT their rest
              // positions; the CSS burst animates FROM the origin, so
              // reduced-motion leaves a quiet starburst glyph.
              const rand = seeded([p.x, width, height]);
              const cy = height * 0.35;
              return Array.from({ length: 6 }, (_, i) => {
                const angle = (i / 6) * Math.PI * 2 + (rand() - 0.5) * 0.8;
                const dist = 4 + rand() * 2;
                const dx = round2(Math.cos(angle) * dist);
                const dy = round2(Math.sin(angle) * dist);
                return (
                  <circle
                    key={i}
                    className="mc-celebrate"
                    cx={round2(Math.min(width, Math.max(0, x + dx)))}
                    cy={round2(Math.min(height, Math.max(0, cy + dy)))}
                    r={0.9}
                    data-mc-ink="accent"
                    style={
                      {
                        "--mc-burst-from": `translate(${-dx}px, ${-dy}px) scale(0)`,
                        animationDelay: `${i * 40}ms`,
                      } as CSSProperties
                    }
                  />
                );
              });
            })()
          : null}
      </g>
    );
  },
};

export function Callout(_props: CalloutProps): ReactNode {
  return standalone("Callout");
}
(Callout as unknown as Branded)[ANNOTATION] = {
  layer: "over",
  render(raw, frame, key) {
    const p = raw as CalloutProps;
    const { width, height, fontSize } = frame;
    const { v: x, off: offX } = pin(frame.x(p.x), width);
    const { v: y, off: offY } = pin(p.y !== undefined ? frame.y(p.y) : height / 2, height);
    const goRight = x < width / 2;
    const elbow = Math.min(5, fontSize);
    const ex = round2(x + (goRight ? elbow : -elbow));
    const ey = seatY(y - elbow, fontSize, height);
    // label anchors at `tx` and runs toward the wider half; truncate if it would
    // overrun that side's remaining width (author labels can't reserve a gutter)
    const tx = round2(ex + (goRight ? 1 : -1));
    const label = fit(p.label, fontSize, goRight ? width - tx : tx);
    return (
      <g key={key} opacity={offX || offY ? 0.4 : undefined}>
        <circle
          cx={x}
          cy={y}
          r={1.5}
          data-mc-ink="point"
          style={p.color ? { fill: p.color } : undefined}
        />
        <line
          x1={x}
          y1={y}
          x2={ex}
          y2={ey}
          stroke={p.color ?? "var(--mc-neutral)"}
          strokeOpacity={0.7}
          vectorEffect="non-scaling-stroke"
          style={{ strokeWidth: 0.75 }}
        />
        <text
          x={tx}
          y={ey}
          fontSize={fontSize}
          style={labelSize(fontSize)}
          textAnchor={goRight ? "start" : "end"}
          dominantBaseline="central"
          data-mc-ink="label"
        >
          {label}
        </text>
      </g>
    );
  },
};
