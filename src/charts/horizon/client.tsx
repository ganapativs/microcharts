"use client";
// Interactive <Horizon>. Interaction is ESSENTIAL here — the encoding is
// learned: the nearest-x crosshair announces the TRUE value, not the band, and
// raises a value dot at the folded position. useActivePicker owns interaction:
// one pointer listener + nearest-x math, roving keyboard (←/→ step x, Home/End
// ends), touch tap-to-pin, and the onActive/onSelect contract. Composes the
// static component (canon).
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
import { describeSeries, EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { EN_SLOTS, type SlotStrings } from "../../core/strings-slots.js";
import { isFiniteValue } from "../../core/types.js";
import { horizonGeometry } from "./geometry.js";
import { Horizon as StaticHorizon, type HorizonProps } from "./index.js";

export interface InteractiveHorizonProps extends HorizonProps, PickerProps {
  strings?: SeriesStrings & SlotStrings;
  /**
   * Opt-in entrance motion (default `false`): the folded bands wipe on when
   * the chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const DEFAULT_STRINGS = { ...EN_SERIES, ...EN_SLOTS };

export function Horizon(props: InteractiveHorizonProps): React.ReactNode {
  const {
    data,
    folds = 2,
    mode = "mirror",
    baseline = 0,
    domain,
    width = 80,
    height = 14,
    format,
    locale,
    strings = DEFAULT_STRINGS,
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
  useEntrance(hostRef, "wipe", animate);

  const geo = useMemo(
    () => horizonGeometry({ width, height, values: data, domain, baseline, folds, mode }),
    [width, height, data, domain, baseline, folds, mode],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : describeSeries(data, { format: fmt, strings });
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // Pointer (viewBox x) → nearest sample index. All samples are navigable
  // (a non-finite one still announces as empty).
  const locate = useCallback(
    (x: number) => {
      if (geo.n === 0) return null;
      const i = Math.round(((x - 0.5) / Math.max(1, width - 1)) * (geo.n - 1));
      return Math.min(geo.n - 1, Math.max(0, i));
    },
    [geo, width],
  );

  // Navigable unit = a data sample; `index` is the data index, `value` its
  // number (or `null` when non-finite).
  const datum = useCallback(
    (i: number) => ({ index: i, value: isFiniteValue(data[i]) ? (data[i] as number) : null }),
    [data],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.n,
    width,
    height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const shown = active ?? selected;
  const value = shown !== null ? data[shown] : undefined;
  const crossX = shown !== null ? geo.xFor(shown) : undefined;
  const selValue = selected !== null && selected !== active ? data[selected] : undefined;
  const selX = selected !== null && selected !== active ? geo.xFor(selected) : undefined;
  const announced =
    shown !== null
      ? isFiniteValue(value)
        ? strings.point(shown + 1, geo.n, fmt(value))
        : strings.pointEmpty(shown + 1, geo.n)
      : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-horizon-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticHorizon
        {...rest}
        style={fillFor(style)}
        data={data}
        folds={folds}
        mode={mode}
        baseline={baseline}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        summary={false}
      >
        {/* Pinned selection persists through pointer-leave; the crosshair is transient. */}
        {selX !== undefined && isFiniteValue(selValue) ? (
          <circle
            cx={selX}
            cy={geo.foldedY(selValue)}
            r={2.6}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {crossX !== undefined ? (
          <>
            <line
              x1={crossX}
              y1={0}
              x2={crossX}
              y2={height}
              data-mc-ink="muted"
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
            {isFiniteValue(value) ? (
              <circle cx={crossX} cy={geo.foldedY(value)} r={1.75} data-mc-ink="accent" />
            ) : null}
          </>
        ) : null}
        {rest.children}
      </StaticHorizon>
      <LiveRegion>{announced}</LiveRegion>
      {crossX !== undefined ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(crossX / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {isFiniteValue(value) ? fmt(value) : "—"}
        </span>
      ) : null}
    </span>
  );
}
