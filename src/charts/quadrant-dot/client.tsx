"use client";
// Interactive <QuadrantDot>. useActivePicker owns interaction: one pointer
// listener + nearest-point (2-D) lookup, ←/→/Home/End cycle focal then peers
// nearest-first, click / Enter / Space selects (onSelect). Composes the static
// component (canon); the focus ring + persistent pin + readout chip are overlay
// children. Index 0 is the focal; 1…n are peers in nearest-first order.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_QUADRANT, type QuadrantStrings } from "../../core/strings-quadrant.js";
import { quadrantDotGeometry, quadrantDotRadii } from "./geometry.js";
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

type Target = { x: number; y: number; vx: number; vy: number; quadrant: 0 | 1 | 2 | 3 };

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
    readout = true,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "settle", animate, {
    selector: 'circle[data-mc-ink="data"], circle[data-mc-ink="ghost"]',
  });

  const geo = useMemo(
    () => quadrantDotGeometry({ width, height, data, field, xDomain, domain, split }),
    [width, height, data, field, xDomain, domain, split],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // Focal first, then peers nearest-first — so the orange subject is hoverable
  // and Home lands on it. Always-nearest (no hit-radius dead zone): at gallery
  // scale ghosts are ~2–3px and a tight radius left the plate feeling dead.
  const targets = useMemo((): Target[] => {
    if (!geo) return [];
    const focal: Target = {
      x: geo.dot.x,
      y: geo.dot.y,
      vx: geo.dot.vx,
      vy: geo.dot.vy,
      quadrant: geo.quadrant,
    };
    return [focal, ...geo.ghosts];
  }, [geo]);

  const count = targets.length;
  const peerCount = Math.max(0, count - 1);
  const { focal: focalR } = quadrantDotRadii(width, height);

  const locate = useCallback(
    (x: number, y: number) => {
      if (targets.length === 0) return null;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i]!;
        const d = (t.x - x) ** 2 + (t.y - y) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      return best;
    },
    [targets],
  );

  const datum = useCallback(
    (i: number) => {
      const t = targets[i];
      return {
        index: i,
        value: t?.vy ?? null,
        formatted: t ? `${fmt(t.vx)}, ${fmt(t.vy)}` : undefined,
      };
    },
    [targets, fmt],
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

  const ring = (i: number, pinned: boolean) => {
    const t = targets[i];
    if (!t) return null;
    return (
      <circle
        cx={t.x}
        cy={t.y}
        r={focalR + 1.4}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const t = shown !== null ? targets[shown] : undefined;
  const qName = t ? nameOf(t.quadrant, xLabel, yLabel, quadrants, strings) : "";
  const announced =
    t && shown !== null
      ? shown === 0
        ? strings.quadrantLone(yLabel, fmt(t.vy), xLabel, fmt(t.vx), qName)
        : strings.quadrantAt(shown, peerCount, xLabel, fmt(t.vx), yLabel, fmt(t.vy), qName)
      : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-quadrant-dot-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticQuadrantDot
        {...rest}
        style={fillFor(style)}
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
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticQuadrantDot>
      {readout && t ? (
        <span
          className="mc-quadrant-dot-readout mc-spark-readout"
          style={{ left: `${(t.x / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {`${fmt(t.vx)}, ${fmt(t.vy)}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
