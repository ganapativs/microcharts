"use client";
// Interactive <BenchmarkStrip>. One pointer listener + pure
// nearest-edge math (never a node per quantile). ←/→ step the five quantile
// edges; each announces its name + value ("p75: 420 ms."). Composes the static
// component (canon); the crosshair tick is an overlay child re-using geometry.
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { FILL, wrap } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_QUANTILE, type QuantileStrings } from "../../core/strings-quantile.js";
import { benchmarkStripGeometry } from "./geometry.js";
import {
  BenchmarkStrip as StaticBenchmarkStrip,
  benchmarkSummary,
  type BenchmarkStripProps,
} from "./index.js";

export interface InteractiveBenchmarkStripProps extends BenchmarkStripProps {
  strings?: QuantileStrings;
  /**
   * Opt-in entrance motion (default `false`): the focal dot settles onto the
   * band on first client-side mount. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function BenchmarkStrip(props: InteractiveBenchmarkStripProps): React.ReactNode {
  const {
    data,
    value,
    range = "p5p95",
    label = "percentile",
    width = 80,
    height = 12,
    format,
    locale,
    strings = EN_QUANTILE,
    title,
    summary,
    animate = false,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "settle", animate, {
    selector: 'circle[data-mc-w="support"], path',
  });

  // must match the static's viewBox (the label gutter widens totalWidth)
  const font = labelFont(height, 0.62);
  const geo = useMemo(
    () =>
      benchmarkStripGeometry({
        width,
        height,
        data,
        value,
        range,
        domain: props.domain,
        gutterCh: label !== "none" ? 4 : 0,
        fontSize: font,
      }),
    [width, height, data, value, range, props.domain, label, font],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : benchmarkSummary(geo, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * geo.totalWidth;
      let best = 0;
      let bestDist = Infinity;
      geo.edges.forEach((edge, i) => {
        const d = Math.abs(edge.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    },
    [geo],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!geo) return;
      const pos = active ?? -1;
      let next = pos;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(geo.edges.length - 1, pos + 1);
          break;
        case "ArrowLeft":
          next = pos <= 0 ? 0 : pos - 1;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.edges.length - 1;
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

  const edge = active !== null && geo ? geo.edges[active] : undefined;
  const announced = edge ? strings.benchmarkEdge(edge.name, fmt(edge.value)) : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-benchmark-strip-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticBenchmarkStrip
        {...rest}
        style={FILL}
        data={data}
        value={value}
        range={range}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {edge ? (
          <line
            x1={edge.x}
            y1={0.5}
            x2={edge.x}
            y2={height - 0.5}
            data-mc-ink="accent"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticBenchmarkStrip>
      <LiveRegion>{announced}</LiveRegion>
      {edge ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${(edge.x / geo!.totalWidth) * 100}%`, transform: "translateX(-50%)" }}
        >
          {fmt(edge.value)}
        </span>
      ) : null}
    </span>
  );
}
