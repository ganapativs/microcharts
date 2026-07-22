"use client";
// Interactive <ChangePoint>. useActivePicker owns interaction: one pointer
// listener + nearest-x lookup, ←/→ (Home/End) step points (value + regime),
// Tab cycles the breaks as first-class stops (each announcing the mean shift),
// click / Enter / Space selects (onSelect). Composes the static component
// (canon); the crosshair + readout chip are overlay children.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import {
  named,
  fillFor,
  nav1d,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_CHANGE_POINT, type ChangePointStrings } from "../../core/strings-change-point.js";
import { changePointGeometry } from "./geometry.js";
import {
  ChangePoint as StaticChangePoint,
  changePointSummary,
  type ChangePointProps,
} from "./index.js";

export interface InteractiveChangePointProps extends ChangePointProps, PickerProps {
  strings?: ChangePointStrings;
  /**
   * Opt-in entrance motion (default `false`): the line draws on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const pct = (frac: number): string =>
  `${frac > 0 ? "+" : frac < 0 ? "−" : ""}${Math.round(Math.abs(frac) * 100)}%`;

export function ChangePoint(props: InteractiveChangePointProps): React.ReactNode {
  const {
    data,
    breaks = "auto",
    maxItems = 2,
    domain,
    format,
    locale,
    width = 80,
    height = 16,
    strings = EN_CHANGE_POINT,
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
  useEntrance(hostRef, "draw", animate);

  const geo = useMemo(
    () => changePointGeometry({ width, height, data, breaks, maxItems, domain }),
    [width, height, data, breaks, maxItems, domain],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // Mirror the static's delta gutter: geometry is laid out in `width`, but the
  // rendered viewBox is `width + gutter`. Mapping the pointer over `width`
  // alone drifts the crosshair right of the cursor and mis-places the readout.
  const FONT = labelFont(height, 0.55);
  const lastBreak = geo ? geo.breaks[geo.breaks.length - 1] : undefined;
  const gutter =
    (props.label ?? "none") === "delta" && lastBreak
      ? Math.ceil(pct(lastBreak.delta).length * FONT * 0.72) + 4
      : 0;
  const totalWidth = width + gutter;

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : changePointSummary(geo, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // regime index for a given point (0-based), plus its mean. Memoised on `geo`
  // so the `datum` callback that reads it stays referentially stable.
  const regimeOf = useCallback(
    (i: number): { regime: number; mean: number } => {
      const seg = geo
        ? geo.segments.findIndex((_, s) => {
            const lo = s === 0 ? 0 : geo.breaks[s - 1]!.index;
            const hi = s === geo.segments.length - 1 ? geo.n : geo.breaks[s]!.index;
            return i >= lo && i < hi;
          })
        : -1;
      return { regime: seg + 1, mean: geo && seg >= 0 ? geo.segments[seg]!.mean : NaN };
    },
    [geo],
  );

  const locate = useCallback(
    (x: number) => {
      if (!geo || data.length === 0) return null;
      const i = Math.round(((x - 2) / (width - 4)) * (data.length - 1));
      return Math.max(0, Math.min(data.length - 1, i));
    },
    [geo, data.length, width],
  );
  // index = the DATA index (points are 1:1 with `data`); value = the series
  // value there (`null` at a gap).
  const datum = useCallback(
    (i: number) => {
      // Mirror the readout chip exactly: a break shows "before→after (pct)",
      // any other point shows its regime badge. (The chip only paints with `geo`
      // present, so we never hit the bare-value fallback here.)
      let formatted: string | undefined;
      if (geo) {
        const brk = geo.breaks.find((b) => b.index === i);
        formatted = brk
          ? `${fmt(brk.before)}→${fmt(brk.after)} (${pct(brk.delta)})`
          : `regime ${regimeOf(i).regime}/${geo.segments.length}`;
      }
      return {
        index: i,
        value: Number.isFinite(data[i]) ? (data[i] as number) : null,
        formatted,
      };
    },
    [data, geo, fmt, regimeOf],
  );

  // The kernel's `step` sees only (current, key), but Shift+Tab must cycle the
  // breaks BACKWARDS. React runs a capture-phase handler on this same span
  // before the bubble-phase one the kernel binds, so latching the modifier here
  // hands `step` the one bit it lacks.
  const shift = useRef(false);
  const breakIdx = useMemo(() => (geo ? geo.breaks.map((b) => b.index) : []), [geo]);
  const step = useCallback(
    (cur: number, key: string) => {
      if (key !== "Tab") return nav1d(cur, data.length, key);
      // Tab / Shift+Tab cycle the breaks as first-class stops; past the last one
      // we return null so focus leaves the chart.
      if (breakIdx.length === 0) return null;
      const next = shift.current
        ? [...breakIdx].reverse().find((x) => cur < 0 || x < cur)
        : breakIdx.find((x) => cur < 0 || x > cur);
      return next ?? null;
    },
    [breakIdx, data.length],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo === null ? 0 : data.length,
    width: totalWidth,
    height,
    locate,
    datum,
    step,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const xOf = (i: number): number => 2 + ((width - 4) * i) / Math.max(1, data.length - 1);
  const crosshair = (i: number, pinned: boolean) => {
    if (!Number.isFinite(data[i])) return null;
    const x = xOf(i);
    return (
      <line
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke="var(--mc-accent)"
        // Pin is "support", not the usual "tick": the static break markers are
        // already line[data-mc-w="tick"], so tick can't identify the pin here.
        data-mc-w={pinned ? "support" : "tick"}
        strokeDasharray="1.5 1.5"
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  // The point shown by the crosshair + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const atBreak = shown !== null && geo ? geo.breaks.find((b) => b.index === shown) : undefined;
  let announced = "";
  if (shown !== null && geo) {
    if (atBreak) {
      announced = strings.changePointBreak(
        atBreak.index,
        fmt(atBreak.before),
        fmt(atBreak.after),
        pct(atBreak.delta),
      );
    } else {
      const { regime, mean } = regimeOf(shown);
      announced = strings.changePointAt(
        shown,
        fmt(data[shown] as number),
        regime,
        geo.segments.length,
        fmt(mean),
      );
    }
  }

  const px = shown !== null && geo ? xOf(shown) : 0;
  const readoutText =
    shown === null
      ? ""
      : atBreak
        ? `${fmt(atBreak.before)}→${fmt(atBreak.after)} (${pct(atBreak.delta)})`
        : geo
          ? `regime ${regimeOf(shown).regime}/${geo.segments.length}`
          : fmt(data[shown] as number);

  return (
    <span
      ref={hostRef}
      {...wrap("mc-change-point-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
      onKeyDownCapture={(e) => (shift.current = e.shiftKey)}
    >
      <StaticChangePoint
        {...rest}
        style={fillFor(style)}
        data={data}
        breaks={breaks}
        maxItems={maxItems}
        domain={domain}
        format={format}
        locale={locale}
        width={width}
        height={height}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? crosshair(selected, true) : null}
        {active !== null ? crosshair(active, false) : null}
        {rest.children}
      </StaticChangePoint>
      {readout && shown !== null && geo ? (
        <span
          className="mc-change-point-readout mc-spark-readout"
          style={crosshairReadoutStyle(px, totalWidth)}
        >
          {readoutText}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
