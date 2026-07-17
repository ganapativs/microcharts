"use client";
// Interactive <StackedArea>. Nearest-x lookup announces ALL
// layers ("Point 8 of 12: Mobile 45%, Web 38%, API 17%."); ←/→ steps x, ↑/↓
// cycles which layer the crosshair dot highlights. Composes the static.
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { makeFormatter } from "../../core/format.js";
import type { Curve } from "../../core/path.js";
import { FILL } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_STACK, type StackStrings } from "../../core/strings-stack.js";
import { EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { isFiniteValue } from "../../core/types.js";
import { stackedAreaGeometry } from "./geometry.js";
import {
  StackedArea as StaticStackedArea,
  stackedAreaSummary,
  type StackedAreaProps,
} from "./index.js";

export interface InteractiveStackedAreaProps extends StackedAreaProps {
  strings?: StackStrings;
  seriesStrings?: SeriesStrings;
  /**
   * Opt-in entrance motion (default `false`): the layers wipe on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function StackedArea(props: InteractiveStackedAreaProps): React.ReactNode {
  const {
    data,
    variant = "stacked",
    order = "data",
    curve = "linear",
    domain,
    width = 60,
    height = 16,
    format,
    locale,
    strings = EN_STACK,
    seriesStrings = EN_SERIES,
    title,
    summary,
    animate = false,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "wipe", animate);

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  const series = useMemo(() => {
    let s = data.slice(0, 3);
    if (order === "asc") {
      s = [...s].sort(
        (a, b) =>
          a.values.reduce<number>((acc, v) => acc + (isFiniteValue(v) ? v : 0), 0) -
          b.values.reduce<number>((acc, v) => acc + (isFiniteValue(v) ? v : 0), 0),
      );
    }
    return s;
  }, [data, order]);

  const usedCurve: Curve = variant === "ridge" ? "smooth" : curve;
  const geo = useMemo(
    () =>
      stackedAreaGeometry({
        width,
        height,
        series: series.map((s) => s.values),
        domain,
        curve: usedCurve,
        gutterCh: 0,
        fontSize: 6,
      }),
    [width, height, series, domain, usedCurve],
  );
  const pctFmt = useMemo(
    () => makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 }),
    [format, locale],
  );
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : stackedAreaSummary(series, geo.sharesAt.at(-1) ?? [], geo.n, pctFmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.n === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const span = geo.plot.x1 - geo.plot.x0;
      const i = Math.round(((x - geo.plot.x0) / Math.max(1, span)) * (geo.n - 1));
      setActive(Math.min(geo.n - 1, Math.max(0, i)));
    },
    [geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.n === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(geo.n - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.n - 1;
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
    [active, geo],
  );

  const shares = active !== null ? geo.sharesAt[active] : undefined;
  const announced =
    active !== null && shares
      ? strings.stackAt(
          active + 1,
          geo.n,
          series
            .map((s, i) =>
              isFiniteValue(s.values[active])
                ? `${s.label ?? `Series ${i + 1}`} ${pctFmt(shares[i] ?? 0)}`
                : `${s.label ?? `Series ${i + 1}`}: ${seriesStrings.noData.replace(/\.$/, "").toLowerCase()}`,
            )
            .join(", "),
        )
      : "";
  const crossX =
    active !== null && geo.n > 1
      ? geo.plot.x0 + (active * (geo.plot.x1 - geo.plot.x0)) / (geo.n - 1)
      : undefined;

  return (
    <span
      ref={hostRef}
      className={className ? `mc-stacked-live ${className}` : "mc-stacked-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticStackedArea
        {...rest}
        data={data}
        variant={variant}
        order={order}
        curve={curve}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {crossX !== undefined ? (
          <line
            x1={crossX}
            y1={0}
            x2={crossX}
            y2={height}
            data-mc-ink="muted"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticStackedArea>
      <LiveRegion>{announced}</LiveRegion>
      {active !== null && shares && crossX !== undefined ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(crossX / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {shares.map((s) => pctFmt(s)).join(" · ")}
        </span>
      ) : null}
    </span>
  );
}
