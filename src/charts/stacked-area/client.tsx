"use client";
// Interactive <StackedArea>. Nearest-x lookup shows ALL layers at the column
// as rows in the chip and as one sentence in the live region ("Point 8 of 12:
// Mobile 45%, Web 38%, API 17%."); ←/→ step x-columns, Enter/Space/click
// selects a column (onSelect). useActivePicker owns interaction; the static is
// composed (summary={false}, crosshair + pin as its children) so the SVG never
// drifts.
import { Fragment, useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import type { Curve } from "../../core/path.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_STACK, type StackStrings } from "../../core/strings-stack.js";
import { EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { chartSide, isFiniteValue } from "../../core/types.js";
import { stackedAreaGeometry, stackedAreaLabelsFit } from "./geometry.js";
import {
  StackedArea as StaticStackedArea,
  stackedAreaSummary,
  type StackedAreaProps,
} from "./index.js";

export interface InteractiveStackedAreaProps extends StackedAreaProps, PickerProps {
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
    mode = "stacked",
    order = "data",
    curve = "linear",
    domain,
    colors,
    width: widthProp = 60,
    height: heightProp = 16,
    format,
    locale,
    strings = EN_STACK,
    seriesStrings = EN_SERIES,
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
  useEntrance(hostRef, "wipe", animate);

  // Same clamp the static applies, for the same reason — and it has to happen
  // here too: the overlay geometry and the pointer→column mapping are computed
  // from these numbers, so an unclamped box would put the crosshair somewhere
  // the marks are not.
  const width = chartSide(widthProp);
  const height = chartSide(heightProp);

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

  const usedCurve: Curve = mode === "ridge" ? "smooth" : curve;
  const fontSize = labelFont(height, 0.3);
  const geo = useMemo(
    () =>
      stackedAreaGeometry({
        width,
        height,
        series: series.map((s) => s.values),
        domain,
        curve: usedCurve,
        // MUST mirror the static: the endpoint-label gutter shrinks the plot,
        // so an overlay computed without it lands off the rendered marks — and
        // the static drops the gutter with the labels, so the fit test is part
        // of the mirror.
        gutterCh:
          rest.label === "last" && stackedAreaLabelsFit(height, series.length, fontSize) ? 4 : 0,
        fontSize,
      }),
    [width, height, series, domain, usedCurve, rest.label, fontSize],
  );
  const pctFmt = useMemo(
    () => makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 }),
    [format, locale],
  );

  // x-column geometry: the navigable units are the n time-columns (x-samples).
  const colX = useCallback(
    (c: number) =>
      geo.n > 1
        ? geo.plot.x0 + (c * (geo.plot.x1 - geo.plot.x0)) / (geo.n - 1)
        : (geo.plot.x0 + geo.plot.x1) / 2,
    [geo],
  );
  const locate = useCallback(
    (x: number) => {
      if (geo.n === 0) return null;
      const span = geo.plot.x1 - geo.plot.x0;
      const i = Math.round(((x - geo.plot.x0) / Math.max(1, span)) * (geo.n - 1));
      return Math.min(geo.n - 1, Math.max(0, i));
    },
    [geo],
  );
  // EVERY band at the column, not just the leader. A composition chart whose
  // readout names one series answers "who is biggest", which is not the
  // question the chart asks — and with a monotone mix (the docs' Mobile/Web/API)
  // the trailing series is never the leader, so its name is unreachable in the
  // UI even though the live region announces it.
  //
  // Listing bands as ONE nowrap line is what blew the cap before (206px past it
  // at three bands). Rows are the fix: the chip's width is now its widest ROW,
  // not the sum of its bands, and `.mc-readout-rows` caps the name column at
  // 7em, so the whole chip is bounded by construction at ~11em — inside the 14em
  // ceiling regardless of label length or series count. Height is bounded by the
  // documented ≤ 3-series cap.
  const bandRows = useCallback(
    (shares: readonly number[], col: number) => {
      // empty array = no override, matching the static: otherwise the swatch
      // went unpainted while the band it mirrors kept the cat palette.
      const pal = colors && colors.length > 0 ? colors : undefined;
      return series.map((s, i) => ({
        name: s.label ?? strings.seriesFallback(i + 1),
        pct: isFiniteValue(s.values[col]) ? pctFmt(shares[i] ?? 0) : "—",
        cat: (i % 3) + 1,
        fill: pal ? pal[i % pal.length] : `var(--mc-cat-${(i % 3) + 1})`,
      }));
    },
    [series, pctFmt, strings, colors],
  );
  // index = column (x-sample) index; value = the stack total at that column
  // (series summed, negatives clamped to 0 — matching the drawn stack).
  // `formatted` mirrors the chip: the full breakdown, comma-joined for callers
  // that render it as one string.
  const datum = useCallback(
    (i: number) => {
      const shares = geo.sharesAt[i];
      return {
        index: i,
        value: series.reduce<number>(
          (t, s) => t + (isFiniteValue(s.values[i]) ? Math.max(0, s.values[i] as number) : 0),
          0,
        ),
        formatted: shares
          ? bandRows(shares, i)
              .map((r) => `${r.name} ${r.pct}`)
              .join(", ")
          : undefined,
      };
    },
    [series, geo, bandRows],
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

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : stackedAreaSummary(series, geo.sharesAt.at(-1) ?? [], geo.n, pctFmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // The column shown by the crosshair + readout: live focus, falling back to a
  // pinned selection when the pointer has left.
  const shown = active ?? selected;
  const shares = shown !== null ? geo.sharesAt[shown] : undefined;
  const announced =
    shown !== null && shares
      ? strings.stackAt(
          shown + 1,
          geo.n,
          series
            .map((s, i) =>
              isFiniteValue(s.values[shown])
                ? `${s.label ?? strings.seriesFallback(i + 1)} ${pctFmt(shares[i] ?? 0)}`
                : `${s.label ?? strings.seriesFallback(i + 1)}: ${seriesStrings.noData.replace(/\.$/, "").toLowerCase()}`,
            )
            .join(", "),
        )
      : "";
  const shownX = shown !== null && geo.n > 0 ? colX(shown) : undefined;
  const selX = selected !== null && geo.n > 0 ? colX(selected) : undefined;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-stacked-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticStackedArea
        {...rest}
        data={data}
        mode={mode}
        order={order}
        curve={curve}
        domain={domain}
        colors={colors}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        labelAt={shown !== null ? shown : undefined}
        style={fillFor(style)}
      >
        {/* Both crosshairs are `data-mc-ui`, so each glides to the column it
            names instead of being repainted at it. They travel on a transform:
            the `x1`/`x2` that place a line have no CSS geometry property behind
            them in any engine, so tagging those would animate nothing. */}
        {selX !== undefined && selected !== active ? (
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={height}
            data-mc-ink="accent"
            data-mc-ui=""
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
            style={{ transform: `translateX(${selX}px)` }}
          />
        ) : null}
        {shownX !== undefined ? (
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={height}
            data-mc-ink="muted"
            data-mc-ui=""
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
            style={{ transform: `translateX(${shownX}px)` }}
          />
        ) : null}
        {rest.children}
      </StaticStackedArea>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shown !== null && shares && shownX !== undefined ? (
        <span
          className="mc-spark-readout mc-readout-rows"
          style={crosshairReadoutStyle(shownX, width)}
        >
          {bandRows(shares, shown).map((r, i) => (
            // Swatch + name + share. The swatch is redundant reinforcement, not
            // the key: the band is NAMED, so the chip never encodes by color
            // alone (and under forced-colors the name is all that survives).
            <Fragment key={i}>
              <span className="mc-readout-key" data-mc-cat={r.cat} style={{ background: r.fill }} />
              <span className="mc-readout-name">{r.name}</span>
              <span className="mc-readout-val">{r.pct}</span>
            </Fragment>
          ))}
        </span>
      ) : null}
    </span>
  );
}
