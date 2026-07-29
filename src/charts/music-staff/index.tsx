// <MusicStaff> — the shape of a short series read as melody.
// Pitch (vertical position on a 5-line staff) is the only channel; time is the
// x order. Reuses describeSeries verbatim (same S1 pipeline as Sparkline) — no
// new summary template.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { describeSeries, type SeriesStrings, resolveSummary } from "../../core/summary.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { lastFinite } from "../../core/stats.js";
import { isFiniteValue, type Value } from "../../core/types.js";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, musicStaffFrame, musicStaffGeometry } from "./geometry.js";

export interface MusicStaffProps {
  data: readonly Value[];
  /** `ledger` (default, ±2 ledger positions) or `staff` (clamp on-staff). */
  mode?: "staff" | "ledger" | undefined;
  /** `last` prints the final value after the last note. */
  label?: "none" | "last" | undefined;
  domain?: readonly [number, number] | undefined;
  color?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  fontSize?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  /** Swappable summary strings (defaults to EN) — the accessible name is
   *  generated, so this is how a non-English host localizes it. */
  strings?: SeriesStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 2;

export function MusicStaff(props: MusicStaffProps): ReactNode {
  const {
    data,
    mode = "ledger",
    label = "none",
    domain,
    color,
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
    format,
    locale,
    title,
    summary,
    strings,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);
  const last = lastFinite(data);
  const labelText = label === "last" && isFiniteValue(last) ? fmt(last) : undefined;
  // One resolution of the box + label metrics, shared with ./client so the two
  // entries cannot disagree about where a note sits.
  const { width, height, fontSize, gutter } = musicStaffFrame({
    width: widthProp,
    height: heightProp,
    fontSize: props.fontSize,
    labelText,
  });
  const showLabel = labelText !== undefined && gutter > 0;
  const geo = musicStaffGeometry({
    values: data,
    domain,
    width: width - gutter,
    height,
    mode,
    pad: PAD,
  });
  const accName = resolveSummary(summary, () => describeSeries(data, { format, locale, strings }));
  const paint = color;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // A staff is a band, not a column: nothing rests on its lowest line, so it
      // centres on the cap band. The note band is inset by an equal pad top and
      // bottom and the five lines are symmetric about its middle in both `mode`
      // settings, so the frame's midpoint IS the staff's — no need to carry the
      // band out of geometry.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={className ? `mc-staff ${className}` : "mc-staff"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {/* Staff + ledger opacity is a presentation ATTRIBUTE, not inline style:
          `.mc-root` sets `forced-color-adjust: none`, so an inline declaration
          survives verbatim into High Contrast Mode and no stylesheet rule can
          lift it back to a legible weight (compare the `unit-off`/`gap` roles,
          whose forced-colors mapping resets stroke-opacity to 1). */}
      <path
        d={geo.staffYs.map((y) => `M${PAD} ${y}L${width - gutter - PAD} ${y}`).join("")}
        data-mc-ink="muted"
        strokeOpacity={0.4}
      />
      {geo.ledger.length ? (
        <path
          d={geo.ledger.map((l) => `M${l.x1} ${l.y}L${l.x2} ${l.y}`).join("")}
          data-mc-ink="muted"
          strokeOpacity={0.7}
        />
      ) : null}
      {/* Contour line — shape only; noteheads carry the values. That is the
          `ghost` role's job description ("low-precision context behind the
          primary mark"), and Constellation's connector between stars already
          takes it. It used to paint an inline `var(--mc-accent)` at 0.28, which
          under `forced-color-adjust: none` reaches High Contrast Mode as a fixed
          brand hex at 28% — invisible against a forced black background. The
          role strokes GrayText there instead. `color` still overrides inline. */}
      {geo.notes.length >= 2 ? (
        <path
          d={geo.notes
            .map((nt, i) => {
              // break the line across a rest (a gap in the original indices) so it
              // never implies a note carried through silence
              const brk = i === 0 || nt.index !== geo.notes[i - 1]!.index + 1;
              return `${brk ? "M" : "L"}${nt.cx} ${nt.cy}`;
            })
            .join("")}
          fill="none"
          data-mc-ink="ghost"
          data-mc-w="tick"
          style={{
            ...(paint ? { stroke: paint } : null),
            strokeLinecap: "round",
            strokeLinejoin: "round",
          }}
        />
      ) : null}
      {/* note heads — tilted ovals, as a real engraved notehead sits; the tilt is
          what reads them as notes rather than squashed dots. The final note (the
          current pitch) is accented — the "you are here" of the melody. */}
      {geo.notes.map((nt, i) => {
        const isLast = i === geo.notes.length - 1;
        return (
          <ellipse
            key={`n${nt.index}`}
            cx={nt.cx}
            cy={nt.cy}
            rx={nt.rx}
            ry={nt.ry}
            // The current pitch takes the accent ROLE, not an inline
            // `fill: var(--mc-accent)`: inline paint survives
            // `forced-color-adjust: none` verbatim, so the one note that matters
            // most kept a brand hex in High Contrast Mode while its neighbours
            // mapped to CanvasText. The role maps it to Highlight instead. Same
            // shape as DotPlot's highlighted dot.
            data-mc-ink={isLast && !paint ? "accent" : "point"}
            style={paint ? { fill: paint } : undefined}
          />
        );
      })}
      {showLabel && geo.lastX !== null ? (
        <text
          x={width - gutter + 1}
          y={height / 2}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor="start"
          data-mc-ink="label"
        >
          {fmt(last as number)}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
