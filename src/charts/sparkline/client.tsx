"use client";
// Interactive <Sparkline> — compose static + useActivePicker overlays; wrapper owns naming/live region.
import { memo, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  navOrder,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { describeSeries, EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { lastFinite } from "../../core/stats.js";
import { isFiniteValue } from "../../core/types.js";
import { labelMetrics, sparkGeometry } from "./geometry.js";
import { Sparkline as StaticSparkline, type SparklineProps } from "./index.js";

const Static = memo(StaticSparkline);
const SVG_NS = "http://www.w3.org/2000/svg";

function uiGroup(svg: SVGSVGElement): SVGGElement {
  let g = svg.querySelector("g[data-mc-ui]") as SVGGElement | null;
  if (!g) {
    g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("data-mc-ui", "");
    svg.appendChild(g);
  }
  return g;
}

export interface InteractiveSparklineProps extends SparklineProps, PickerProps {
  /** Swappable announcement strings (defaults to EN). */
  strings?: SeriesStrings;
  /**
   * Opt-in entrance motion (default `false`): the line draws on when the chart
   * first mounts client-side. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function Sparkline(props: InteractiveSparklineProps): React.ReactNode {
  const {
    data,
    domain,
    width = 80,
    height = 20,
    fill = false,
    band,
    label = "none",
    title,
    summary,
    format,
    locale,
    strings = EN_SERIES,
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

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // Same geometry inputs as the static render (pure → identical numbers),
  // including the label gutters, so overlay marks line up exactly.
  const geo = useMemo(() => {
    const last = lastFinite(data);
    const labelText = label === "last" && last !== undefined ? fmt(last) : undefined;
    const gutterRight = labelText !== undefined ? labelMetrics(labelText, width, height).gutter : 0;
    const mmSize = Math.max(5, Math.min(Math.round(height * 0.22), 9));
    const gutterY = label === "minmax" && height >= (mmSize + 1) * 2 + 12 ? mmSize + 1 : 0;
    return sparkGeometry(data, {
      width,
      height,
      domain,
      zero: fill,
      band,
      gutterRight,
      gutterTop: gutterY,
      gutterBottom: gutterY,
      maxPoints: props.maxPoints,
    });
  }, [data, width, height, domain, fill, band, label, fmt, props.maxPoints]);

  // Indices with a finite value — the only navigable stops. Callbacks report the
  // DATA index (what the consumer indexes into), so we walk finite indices and
  // hit-test to the nearest one, but never land on a gap.
  const stops = useMemo(
    () => data.map((v, i) => (isFiniteValue(v) ? i : -1)).filter((i) => i >= 0),
    [data],
  );

  const locate = useCallback(
    (x: number) => {
      if (stops.length === 0) return null;
      let best = stops[0]!;
      let bestDist = Infinity;
      for (const i of stops) {
        const p = geo.points[i];
        if (!p) continue;
        const d = Math.abs(p[0] - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      return best;
    },
    [stops, geo],
  );

  const step = useCallback((cur: number, key: string) => navOrder(stops, cur, key), [stops]);

  const datum = useCallback(
    (i: number) => ({ index: i, value: data[i] as number, formatted: fmt(data[i] as number) }),
    [data, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: stops.length,
    width,
    height,
    locate,
    datum,
    step,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  // `strings` reaches the announcements but was missing HERE, so a host that
  // localized the readout still got an English accessible name on the wrapper —
  // while the static entry it composes localized the same name correctly.
  // sparkbar's client entry already passes it; this was the divergence.
  const accName =
    summary === false ? undefined : (summary ?? describeSeries(data, { format, locale, strings }));
  // The unit shown by the crosshair + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const shownValue = shown !== null ? (data[shown] as number) : null;
  const shownPoint = shown !== null ? geo.points[shown] : null;
  const shownPos = shown !== null ? stops.indexOf(shown) + 1 : 0;
  const selPoint = selected !== null ? geo.points[selected] : null;
  const svgStyle = useMemo(() => fillFor(style), [style]);

  // Scrub/selection marks — DOM, not React children — so memo(Static) can skip
  // rebuilding the series path on every active step.
  useLayoutEffect(() => {
    const svg = hostRef.current?.querySelector("svg");
    if (!svg) return;
    const g = uiGroup(svg);
    g.replaceChildren();
    if (selPoint) {
      const ring = document.createElementNS(SVG_NS, "circle");
      ring.setAttribute("cx", String(selPoint[0]));
      ring.setAttribute("cy", String(selPoint[1]));
      ring.setAttribute("r", "3.2");
      ring.setAttribute("fill", "none");
      ring.setAttribute("data-mc-ink", "accent");
      ring.setAttribute("data-mc-w", "tick");
      ring.setAttribute("vector-effect", "non-scaling-stroke");
      g.appendChild(ring);
    }
    if (shownPoint) {
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", String(shownPoint[0]));
      line.setAttribute("y1", String(geo.plot.y0));
      line.setAttribute("x2", String(shownPoint[0]));
      line.setAttribute("y2", String(geo.plot.y1));
      line.setAttribute("data-mc-ink", "muted");
      line.setAttribute("vector-effect", "non-scaling-stroke");
      g.appendChild(line);
      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("cx", String(shownPoint[0]));
      dot.setAttribute("cy", String(shownPoint[1]));
      dot.setAttribute("r", "2.6");
      dot.setAttribute("data-mc-ink", "accent");
      g.appendChild(dot);
    }
  }, [selPoint, shownPoint, geo.plot.y0, geo.plot.y1]);

  return (
    <span
      ref={hostRef}
      {...wrap("mc-spark-interactive", className, style)}
      {...named([title, accName].filter(Boolean).join(". ") || undefined)}
      {...bind}
    >
      <Static
        {...rest}
        data={data}
        domain={domain}
        width={width}
        height={height}
        fill={fill}
        band={band}
        label={label}
        format={format}
        locale={locale}
        summary={false}
        style={svgStyle}
      >
        {rest.children}
      </Static>
      <LiveRegion>
        {shownValue !== null ? strings.point(shownPos, stops.length, fmt(shownValue)) : ""}
      </LiveRegion>
      {readout &&
      shownPoint &&
      shownValue !== null &&
      /* At the endpoint the persistent `label="last"` already shows this value —
         a floating readout there just collides with it. Skip it; every other
         point still gets the readout. */
      !(label === "last" && shown === stops[stops.length - 1]) ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(shownPoint[0], width)}>
          {fmt(shownValue)}
        </span>
      ) : null}
    </span>
  );
}
