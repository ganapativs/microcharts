"use client";
// Interactive <QuadrantDot>. useActivePicker owns interaction: one pointer
// listener + nearest-point (2-D) lookup within a hit radius, ←/→/Home/End cycle
// the peer field in nearest-first order, click / Enter / Space selects
// (onSelect). Composes the static component (canon); the focus ring + persistent
// pin + readout chip are overlay children.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_QUADRANT, type QuadrantStrings } from "../../core/strings-quadrant.js";
import { quadrantDotGeometry } from "./geometry.js";
import {
  QuadrantDot as StaticQuadrantDot,
  quadrantSummary,
  type QuadrantDotProps,
  type QuadrantNames,
} from "./index.js";

export interface InteractiveQuadrantDotProps extends QuadrantDotProps, PickerProps {
  strings?: QuadrantStrings;
  /**
   * Opt-in entrance motion (default `false`): the focal dot and its peer
   * field settle into place on first client-side mount. Inert on the server
   * and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

// derive the quadrant name from a peer's quadrant index (TL0 TR1 BL2 BR3)
const nameOf = (
  q: 0 | 1 | 2 | 3,
  xLabel: string,
  yLabel: string,
  quadrants: QuadrantNames | undefined,
  strings: QuadrantStrings,
): string =>
  quadrants
    ? quadrants[q]
    : strings.quadrantName(q === 0 || q === 1, yLabel, q === 1 || q === 3, xLabel);

export function QuadrantDot(props: InteractiveQuadrantDotProps): React.ReactNode {
  const {
    data,
    field,
    xDomain,
    domain,
    split,
    quadrants,
    xLabel = "x",
    yLabel = "y",
    format,
    locale,
    width = 24,
    height = 24,
    strings = EN_QUADRANT,
    title,
    summary,
    animate = false,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // The soft accent glow behind the focal dot has no data-mc-ink attribute
  // (a literal fill), so it isn't selected — it still fades in with the base
  // whole-svg fade.
  // Focal + peer ghosts settle together. (The focal is always present; the
  // peer `field` is optional, so it must stay in the selector — deferring it
  // would leave a fieldless chart with no story mark and collapse to a wipe.)
  useEntrance(hostRef, "settle", animate, {
    selector: 'circle[data-mc-ink="data"], circle[data-mc-ink="ghost"]',
  });

  const geo = useMemo(
    () => quadrantDotGeometry({ width, height, data, field, xDomain, domain, split }),
    [width, height, data, field, xDomain, domain, split],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  const count = geo?.ghosts.length ?? 0;

  // Nearest peer to the pointer within a 3-unit (squared 9) hit radius. The
  // navigable units are the peer ghosts; datum.index is the ghost index in the
  // chart's nearest-first order (not the input `field` order — field is
  // re-sorted by distance from the focal, then capped at 30).
  const locate = useCallback(
    (x: number, y: number) => {
      if (!geo) return null;
      let best = -1;
      let bestDist = 9;
      geo.ghosts.forEach((g, i) => {
        const d = (g.x - x) ** 2 + (g.y - y) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best >= 0 ? best : null;
    },
    [geo],
  );

  // A scatter point has no single "primary" number, so we report the y value
  // (the conventional dependent axis — `domain` is the y grammar); the readout
  // still shows both coordinates.
  const datum = useCallback(
    (i: number) => ({ index: i, value: geo?.ghosts[i]?.vy ?? null }),
    [geo],
  );

  const { active, selected, bind } = useActivePicker({
    count,
    width,
    height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : quadrantSummary(geo, { xLabel, yLabel, quadrants }, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const focalR = Math.max(1.6, Math.min(width, height) * 0.1);

  const ring = (i: number, pinned: boolean) => {
    const g = geo?.ghosts[i];
    if (!g) return null;
    return (
      <circle
        cx={g.x}
        cy={g.y}
        r={focalR + 1.4}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const g = shown !== null && geo ? geo.ghosts[shown] : undefined;
  const announced =
    g && shown !== null
      ? strings.quadrantAt(
          shown + 1,
          count,
          xLabel,
          fmt(g.vx),
          yLabel,
          fmt(g.vy),
          nameOf(g.quadrant, xLabel, yLabel, quadrants, strings),
        )
      : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-quadrant-dot-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      {...bind}
    >
      <StaticQuadrantDot
        {...rest}
        style={FILL}
        data={data}
        field={field}
        xDomain={xDomain}
        domain={domain}
        split={split}
        quadrants={quadrants}
        xLabel={xLabel}
        yLabel={yLabel}
        format={format}
        locale={locale}
        width={width}
        height={height}
        strings={strings}
        summary={false}
      >
        {/* Pinned selection persists through pointer-leave; focus ring is transient. */}
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticQuadrantDot>
      {g && geo ? (
        <span
          className="mc-quadrant-dot-readout mc-spark-readout"
          style={{ left: `${(g.x / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {/* Axis names are constant for the whole chart (they are in the title
              and the summary), and the quadrant IS the dot's position in the
              grid — naming it here repeated both axis labels a second time. The
              live region below still announces the full quadrant sentence. */}
          {`${fmt(g.vx)}, ${fmt(g.vy)}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
