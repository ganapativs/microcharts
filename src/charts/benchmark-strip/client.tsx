"use client";
// Interactive <BenchmarkStrip>. useActivePicker owns interaction: one pointer
// listener + nearest-edge math (never a node per quantile). ←/→ step the five
// quantile edges; each announces its name + value ("p75: 420 ms."). Click /
// Enter / Space selects an edge (onSelect). Composes the static component
// (canon); the crosshair tick is an overlay child re-using geometry.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_QUANTILE, type QuantileStrings } from "../../core/strings-quantile.js";
import { benchmarkStripGeometry } from "./geometry.js";
import {
  BenchmarkStrip as StaticBenchmarkStrip,
  benchmarkSummary,
  type BenchmarkStripProps,
} from "./index.js";

export interface InteractiveBenchmarkStripProps extends BenchmarkStripProps, PickerProps {
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
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
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

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : benchmarkSummary(geo, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // Pointer (viewBox space) → nearest quantile edge.
  const locate = useCallback(
    (x: number) => {
      if (!geo || geo.edges.length === 0) return null;
      let best = 0;
      let bestDist = Infinity;
      geo.edges.forEach((edge, i) => {
        const d = Math.abs(edge.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [geo],
  );

  // index = quantile edge (0 = lowest band edge … 4 = highest); value = the edge
  // value; label = its name (p5/p25/p50/p75/p95 or min/max on small-n fallback).
  const datum = useCallback(
    (i: number) => {
      const e = geo?.edges[i];
      return { index: i, value: e?.value ?? null, label: e?.name };
    },
    [geo],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo?.edges.length ?? 0,
    width: geo?.totalWidth ?? width,
    height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const tick = (i: number, pinned: boolean) => {
    const e = geo?.edges[i];
    if (!e) return null;
    return (
      <line
        x1={e.x}
        y1={0.5}
        x2={e.x}
        y2={height - 0.5}
        data-mc-ink="accent"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const edge = geo && shown !== null ? geo.edges[shown] : undefined;
  const announced = edge ? strings.benchmarkEdge(edge.name, fmt(edge.value)) : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-benchmark-strip-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticBenchmarkStrip
        {...rest}
        style={fillFor(style)}
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
        {selected !== null && selected !== active ? tick(selected, true) : null}
        {active !== null ? tick(active, false) : null}
        {rest.children}
      </StaticBenchmarkStrip>
      <LiveRegion>{announced}</LiveRegion>
      {edge ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(edge.x / (geo!.totalWidth || width)) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${edge.name} ${fmt(edge.value)}`}
        </span>
      ) : null}
    </span>
  );
}
