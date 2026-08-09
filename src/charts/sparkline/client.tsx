"use client";
// Interactive <Sparkline> — compose static + useActivePicker overlays; wrapper owns naming/live region.
import { memo, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import {
  CHIP,
  named,
  fillFor,
  navOrder,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { describeSeries, EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { isFiniteValue } from "../../core/types.js";
import { lastLabelMetrics, minmaxFont, sparkGeometry } from "./geometry.js";
import { lastFinite } from "../../core/stats.js";
import { Sparkline as StaticSparkline, type SparklineProps } from "./index.js";

const Static = memo(StaticSparkline);

// Selection ring, then the live pair (crosshair + dot) on a wrapper that gets
// moved as one. Built once per chart; see the effect below for why.
// `vector-effect` is not spelled here: styles.css pins it on every stroked
// `[data-mc-ui]` mark, which is where these live. Same painted stroke, and the
// bytes it frees are what buys the readout its place in the top layer.
const UI_MARKS =
  '<circle r="3.2" fill="none" data-mc-active="" data-mc-w="tick"/>' +
  '<g><line data-mc-ink="muted"/><circle r="2.6" data-mc-ink="accent"/></g>';

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
    const gutterRight = lastLabelMetrics(labelText, width, height, props.labelSize)?.gutter ?? 0;
    const mmFont = minmaxFont(height, label, props.labelSize);
    const gutterY = mmFont && mmFont + 1;
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
  }, [data, width, height, domain, fill, band, label, fmt, props.maxPoints, props.labelSize]);

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
  //
  // Every lookup goes through `?? -1` rather than a null test, which costs
  // nothing and closes a real hole: a pin can outlive the data that made it (a
  // live series shrinks while a point is pinned, or a `selectedIndex` names a
  // gap), and an index that no longer resolves has to read as "nothing shown".
  //
  // `shownPoint` is what says the index IS shown: geometry emits a point only
  // where the value is finite, so a gap and a runaway index are both `null`
  // there. Announcement and chip gate on it, and read the value through it —
  // indexing straight into `data` was how `undefined` reached the live region
  // as a formatted number ("Point 0 of 3: NaN").
  const shown = active ?? selected;
  const shownPoint = geo.points[shown ?? -1] ?? null;
  const shownValue = data[shown ?? -1] as number;
  const shownPos = stops.indexOf(shown ?? -1) + 1;
  const selPoint = geo.points[selected ?? -1] ?? null;
  const svgStyle = useMemo(() => fillFor(style), [style]);

  // Scrub/selection marks — DOM, not React children — so memo(Static) can skip
  // rebuilding the series path on every active step.
  //
  // Built once and then MOVED, never replaced: a node recreated per pointer
  // sample cannot transition, and styles.css glides these so the crosshair
  // TRAVELS to the next datum instead of being repainted at it. Unused marks
  // hide in place, which keeps their identity (and their transition) across a
  // scrub that pins and unpins a point.
  //
  // Every axis of this travel is carried by `transform`, never by the marks' own
  // coordinates. Two separate reasons, and both matter:
  //   - `x1`/`x2` have no CSS geometry property in ANY engine, so a line
  //     positioned that way cannot transition at all.
  //   - `cx`/`cy` DO have one, but only from Safari 17.4 and Firefox 128, while
  //     this package supports Safari 16.4+. Moving the dot vertically by `cy`
  //     would glide on Chrome and snap on a supported Safari — a dot jumping
  //     beside a gliding crosshair, which is worse than both snapping.
  // So the wrapper carries the pair horizontally and the dot carries itself
  // vertically, both through transform, which is animatable everywhere.
  useLayoutEffect(() => {
    const svg = hostRef.current?.querySelector("svg");
    if (!svg) return;
    // The group is PARSED, not constructed: the marks below already rely on
    // SVG-namespace HTML parsing, so reusing it here drops the namespace
    // constant and the createElementNS/setAttribute pair with no change to the
    // tree produced.
    let g = svg.querySelector("g[data-mc-ui]");
    if (!g) {
      svg.insertAdjacentHTML("beforeend", "<g data-mc-ui></g>");
      g = svg.lastElementChild!;
    }
    // Built on the first interaction, not at mount: the entrance engine casts
    // every leaf in the SVG, so marks that exist while still hidden get picked
    // up as stage ink and animated to `opacity: 1` — flashing a crosshair the
    // reader never asked for. No interaction yet means nothing to reveal.
    if (!g.firstChild) {
      if (!selPoint && !shownPoint) return;
      g.innerHTML = UI_MARKS;
    }
    const [ring, live] = g.children as unknown as [SVGElement, SVGElement];
    ring.setAttribute("opacity", selPoint ? "1" : "0");
    // The pin is placed by `cx`/`cy`, NOT by a transform, and that is what makes
    // it snap: styles.css glides transforms only. A ring names one discrete
    // point, and a ring in transit encloses none.
    if (selPoint) {
      ring.setAttribute("cx", `${selPoint[0]}`);
      ring.setAttribute("cy", `${selPoint[1]}`);
    }
    live.setAttribute("opacity", shownPoint ? "1" : "0");
    if (shownPoint) {
      live.style.transform = `translateX(${shownPoint[0]}px)`;
      const marks = live.children as unknown as SVGElement[];
      marks[0]!.setAttribute("y1", `${geo.plot.y0}`);
      marks[0]!.setAttribute("y2", `${geo.plot.y1}`);
      marks[1]!.style.transform = `translateY(${shownPoint[1]}px)`;
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
        {shownPoint ? strings.point(shownPos, stops.length, fmt(shownValue)) : ""}
      </LiveRegion>
      {readout &&
      shownPoint &&
      /* At the endpoint the persistent `label="last"` already shows this value —
         a floating readout there just collides with it. Skip it; every other
         point still gets the readout. A NAMED point is not a duplicate: the
         point still gets the readout. */
      !(label === "last" && shown === stops[stops.length - 1]) ? (
        <span className="mc-spark-readout" {...CHIP}>
          {fmt(shownValue)}
        </span>
      ) : null}
    </span>
  );
}
