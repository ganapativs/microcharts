"use client";
// Interactive <ControlStrip>. One pointer listener + nearest-x. ←/→ step all
// points; Home/End jump ends; Enter/Space/click pins a point (onSelect). (Tab is
// left for focus egress.) useActivePicker owns interaction, composing the static
// component (canon); the crosshair + readout chip are overlay children.
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
import { EN_CONTROL, type ControlStrings } from "../../core/strings-control.js";
import { isFiniteValue } from "../../core/types.js";
import { controlGeometry } from "./geometry.js";
import {
  ControlStrip as StaticControlStrip,
  controlSummary,
  type ControlStripProps,
} from "./index.js";

export interface InteractiveControlStripProps extends ControlStripProps, PickerProps {
  strings?: ControlStrings;
  /**
   * Opt-in entrance motion (default `false`): the process line draws on first
   * client-side mount. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function ControlStrip(props: InteractiveControlStripProps): React.ReactNode {
  const {
    data,
    limits = "sigma",
    baseline,
    rules = "none",
    width = 80,
    height = 16,
    format,
    locale,
    strings = EN_CONTROL,
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
  useEntrance(hostRef, "draw", animate);

  const geo = useMemo(
    () => controlGeometry({ width, height, data, limits, baseline, rules, domain: props.domain }),
    [width, height, data, limits, baseline, rules, props.domain],
  );
  // Plotted points are the finite subset (geometry filters non-finite); the
  // navigable index runs over these, so values line up with geo.points 1:1.
  const finite = useMemo(() => data.filter(isFiniteValue), [data]);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  const count = geo?.points.length ?? 0;

  const locate = useCallback(
    (x: number) => {
      if (!geo || count === 0) return null;
      let best = 0;
      let bestDist = Infinity;
      geo.points.forEach((p, i) => {
        const d = Math.abs(p.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [geo, count],
  );
  // index = plotted-point index (finite points, in order); value = its measurement.
  const datum = useCallback((i: number) => ({ index: i, value: finite[i] ?? null }), [finite]);

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
          : controlSummary(geo, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // The point shown by the crosshair + readout: live focus, falling back to a
  // pinned selection when the pointer has left.
  const shown = active ?? selected;
  const p = shown !== null && geo ? geo.points[shown] : undefined;
  const value = shown !== null ? finite[shown] : undefined;
  const side = p?.out && value !== undefined ? (value > geo!.band.hi ? "upper" : "lower") : null;
  const announced =
    p && value !== undefined
      ? strings.controlAt(
          shown! + 1,
          count,
          fmt(value),
          side,
          side === "upper" ? fmt(geo!.band.hi) : side === "lower" ? fmt(geo!.band.lo) : "",
        )
      : "";

  const mark = (i: number, pinned: boolean) => {
    const pt = geo?.points[i];
    if (!pt) return null;
    return (
      <>
        <line
          x1={pt.x}
          y1={0.5}
          x2={pt.x}
          y2={height - 0.5}
          data-mc-ink="muted"
          data-mc-w={pinned ? "tick" : "support"}
          strokeDasharray={pinned ? undefined : "1.5 2"}
          vectorEffect="non-scaling-stroke"
        />
        {/* focus/pin ring stroke is state-dependent (negative when out), so it
            stays an attribute — a role can't switch color per point */}
        <circle
          cx={pt.x}
          cy={pt.y}
          r={2.4}
          fill="none"
          stroke={pt.out ? "var(--mc-negative)" : "var(--mc-accent)"}
          data-mc-w="support"
          vectorEffect="non-scaling-stroke"
        />
      </>
    );
  };

  return (
    <span
      ref={hostRef}
      {...wrap("mc-control-strip-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticControlStrip
        {...rest}
        style={fillFor(style)}
        data={data}
        limits={limits}
        baseline={baseline}
        rules={rules}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? mark(selected, true) : null}
        {active !== null ? mark(active, false) : null}
        {rest.children}
      </StaticControlStrip>
      {p && value !== undefined ? (
        <span
          className="mc-control-readout mc-spark-readout"
          style={{ left: `${(p.x / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {`${fmt(value)}${side ? ` ${side === "upper" ? "above" : "below"} ${fmt(side === "upper" ? geo!.band.hi : geo!.band.lo)}` : ""}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
