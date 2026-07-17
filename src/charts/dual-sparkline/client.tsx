"use client";
// Interactive <DualSparkline>. Nearest-x lookup announces BOTH
// series ("Point 9 of 12: 17 vs 15."); crosshair touches both lines. ←/→
// steps x. Composes the static component (canon).
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_VS, type VsStrings } from "../../core/strings-vs.js";
import { EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { isFiniteValue } from "../../core/types.js";
import { dualSparklineGeometry } from "./geometry.js";
import {
  DualSparkline as StaticDualSparkline,
  dualSummary,
  type DualSparklineProps,
} from "./index.js";

export interface InteractiveDualSparklineProps extends DualSparklineProps {
  strings?: VsStrings;
  seriesStrings?: SeriesStrings;
  /**
   * Opt-in entrance motion (default `false`): the primary line draws on when
   * the chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function DualSparkline(props: InteractiveDualSparklineProps): React.ReactNode {
  const {
    data,
    compare,
    curve = "linear",
    band,
    label = "none",
    domain,
    width = 60,
    height = 16,
    format,
    locale,
    strings = EN_VS,
    seriesStrings = EN_SERIES,
    title,
    summary,
    animate = false,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "draw", animate);

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const fontSize = Math.max(5, Math.min(Math.round(height * 0.4), 8));
  const lastText =
    label === "last"
      ? [...data].reverse().find((v): v is number => Number.isFinite(v ?? Number.NaN))
      : undefined;
  const geo = useMemo(
    () =>
      dualSparklineGeometry({
        width,
        height,
        primary: data,
        compare,
        domain,
        band,
        curve,
        gutterCh: lastText !== undefined ? fmt(lastText).length : 0,
        fontSize,
      }),
    [width, height, data, compare, domain, band, curve, lastText, fmt, fontSize],
  );
  const n = Math.max(data.length, compare.length);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : dualSummary(data, compare, fmt, strings, seriesStrings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (n === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const span = geo.plot.x1 - geo.plot.x0;
      const i = Math.round(((x - geo.plot.x0) / Math.max(1, span)) * (n - 1));
      setActive(Math.min(n - 1, Math.max(0, i)));
    },
    [n, geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (n === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(n - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = n - 1;
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      setActive(next);
    },
    [active, n],
  );

  const pv = active !== null ? data[active] : undefined;
  const cv = active !== null ? compare[active] : undefined;
  const announced =
    active !== null
      ? strings.vsAt(
          active + 1,
          n,
          isFiniteValue(pv) ? fmt(pv) : seriesStrings.noData,
          isFiniteValue(cv) ? fmt(cv) : seriesStrings.noData,
        )
      : "";
  const crossX =
    active !== null
      ? (geo.primaryPoints[active]?.[0] ?? geo.comparePoints[active]?.[0])
      : undefined;

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      ref={hostRef}
      className={className ? `mc-dual-live ${className}` : "mc-dual-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticDualSparkline
        {...rest}
        style={FILL}
        data={data}
        compare={compare}
        curve={curve}
        band={band}
        label={label}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        seriesStrings={seriesStrings}
        summary={false}
      >
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
            {geo.primaryPoints[active!] ? (
              <circle
                cx={geo.primaryPoints[active!]![0]}
                cy={geo.primaryPoints[active!]![1]}
                r={2}
                data-mc-ink="accent"
              />
            ) : null}
            {geo.comparePoints[active!] ? (
              <circle
                cx={geo.comparePoints[active!]![0]}
                cy={geo.comparePoints[active!]![1]}
                r={1.5}
                style={{ fill: "var(--mc-neutral)" }}
              />
            ) : null}
          </>
        ) : null}
        {rest.children}
      </StaticDualSparkline>
      <LiveRegion>{announced}</LiveRegion>
      {active !== null && crossX !== undefined ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(crossX / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${isFiniteValue(pv) ? fmt(pv) : "—"} vs ${isFiniteValue(cv) ? fmt(cv) : "—"}`}
        </span>
      ) : null}
    </span>
  );
}
