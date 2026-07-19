"use client";
// Interactive <QuantileDots> — the probe. Pointer x moves a live threshold and
// the count past it recomputes purely; ←/→ step it one quantile bin, Enter /
// Space / click pins a bin, Esc returns to the prop threshold. useActivePicker
// owns interaction. Composes the static component with the live threshold
// (canon); the readout chip reports the odds.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_QUANTILE_DOTS, type QuantileDotsStrings } from "../../core/strings-quantile-dots.js";
import { labelFont } from "../../core/labels.js";
import { quantileDotplot } from "../../core/quantile.js";
import { round2 } from "../../core/types.js";
import { quantileDotsGeometry, type QuantileDotsGeometry } from "./geometry.js";
import { QuantileDots as StaticQuantileDots, type QuantileDotsProps } from "./index.js";

export interface InteractiveQuantileDotsProps extends QuantileDotsProps, PickerProps {
  strings?: QuantileDotsStrings;
  /**
   * Opt-in entrance motion (default `false`): the quantile dots pop into
   * their columns in order on first client-side mount. Inert on the server
   * and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function QuantileDots(props: InteractiveQuantileDotsProps): React.ReactNode {
  const {
    data,
    count,
    threshold,
    side = "above",
    width = 80,
    height = 20,
    format,
    locale,
    strings = EN_QUANTILE_DOTS,
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
  // "trail" + order "x" pops the dots by true column position, a clean
  // left→right fill. Authored (index) order interleaves neutral and flagged
  // dots into two waves; column order reads as the stack being counted out.
  useEntrance(hostRef, "trail", animate, {
    selector: '[data-mc-ink="neutral"], [data-mc-ink="flag"]',
    order: "x",
  });

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // The dotplot itself — columns, bin width and per-column masses — is
  // independent of the threshold, so it is the stable basis for navigation
  // (the geometry below is not: its label gutter widens with the live count).
  const plot = useMemo(
    () => quantileDotplot(data, Math.max(1, Math.min(25, Math.round(count ?? 20)))),
    [data, count],
  );
  const columns = plot?.columns ?? 0;
  const colCounts = useMemo(() => {
    const c = Array.from<number>({ length: columns }).fill(0);
    if (plot) for (const d of plot.dots) c[d.column]!++;
    return c;
  }, [plot, columns]);
  /** Data value at the left edge of quantile bin `i` — where the probe sits. */
  const binLo = useCallback(
    (i: number) => (plot ? round2(plot.x0 + i * plot.binWidth) : undefined),
    [plot],
  );

  // The rendered viewBox width varies with the live "N in count" gutter, so the
  // pointer basis is read from the LAST rendered geometry (below) instead of
  // being captured at hook-call time — hence hit-testing in 0–1 wrapper
  // fractions (`width`/`height` of 1) and converting inside `locate`.
  const geoRef = useRef<QuantileDotsGeometry | null>(null);
  const locate = useCallback(
    (f: number) => {
      const g = geoRef.current;
      if (!g || columns === 0) return null;
      const t = ((f * g.totalWidth - g.pad) / (width - 2 * g.pad)) * columns;
      return Math.max(0, Math.min(columns - 1, Math.floor(t)));
    },
    [columns, width],
  );
  // `index` is the quantile BIN (column) index — not an index into `data`, and
  // not a dot index: the navigable unit is the column of dots the probe snaps
  // to. `value` is that column's probability mass in dots (`null` for an empty
  // column), `label` its formatted value range.
  const datum = useCallback(
    (i: number) => {
      const lo = binLo(i);
      return {
        index: i,
        value: colCounts[i] ? colCounts[i]! : null,
        label:
          lo === undefined ? undefined : `${fmt(lo)}–${fmt(round2(lo + (plot?.binWidth ?? 0)))}`,
      };
    },
    [binLo, colCounts, fmt, plot],
  );

  const { active, selected, bind } = useActivePicker({
    count: columns,
    width: 1,
    height: 1,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  // The probe shown by the threshold line + readout: the live hover/keyboard
  // focus, falling back to a pinned selection, then to the prop threshold.
  const shown = active ?? selected;
  const activeThreshold = (shown !== null ? binLo(shown) : undefined) ?? threshold;

  // Mirror the static's label gutter so `totalWidth` matches the rendered
  // viewBox exactly. The composed static reserves a right gutter for the
  // "N in count" label (widening the viewBox past `width`); if the pointer
  // map and readout used a gutter-less `totalWidth`, the crosshair line
  // (drawn at the true viewBox scale) would drift right of the cursor.
  const geo = useMemo(() => {
    const base = quantileDotsGeometry({
      width,
      height,
      data,
      count,
      threshold: activeThreshold,
      side,
      domain: props.domain,
    });
    const hasThreshold = activeThreshold !== undefined && Number.isFinite(activeThreshold);
    const showLabel = (props.label ?? "count") === "count" && hasThreshold && base != null;
    const gutterCh = showLabel ? `${base!.past} in ${base!.count}`.length : 0;
    return quantileDotsGeometry({
      width,
      height,
      data,
      count,
      threshold: activeThreshold,
      side,
      domain: props.domain,
      gutterCh,
      fontSize: labelFont(height),
    });
  }, [width, height, data, count, activeThreshold, side, props.domain, props.label]);
  geoRef.current = geo;

  // static accessible name reflects the PROP threshold (the documented default)
  const staticName = useMemo(
    () =>
      quantileDotsGeometry({ width, height, data, count, threshold, side, domain: props.domain }),
    [width, height, data, count, threshold, side, props.domain],
  );
  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : staticName === null
          ? strings.noData
          : threshold !== undefined && Number.isFinite(threshold)
            ? strings.quantileDots(staticName.past, staticName.count, side, fmt(threshold))
            : strings.quantileDotsRange(
                fmt(staticName.mode.lo),
                fmt(staticName.mode.hi),
                fmt(staticName.min),
                fmt(staticName.max),
              );
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const announced =
    geo && activeThreshold !== undefined && Number.isFinite(activeThreshold)
      ? strings.quantileDots(geo.past, geo.count, side, fmt(activeThreshold))
      : "";

  // Pinned selection persists through pointer-leave; the static's own threshold
  // line follows the transient probe.
  const selLo = selected !== null && selected !== active ? binLo(selected) : undefined;
  const selX =
    geo && selLo !== undefined
      ? geo.range === 0
        ? geo.pad + (width - 2 * geo.pad) / 2
        : geo.pad + Math.max(0, Math.min(1, (selLo - geo.x0) / geo.range)) * (width - 2 * geo.pad)
      : null;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-quantile-dots-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      {...bind}
    >
      <StaticQuantileDots
        {...rest}
        style={FILL}
        data={data}
        count={count}
        threshold={activeThreshold}
        side={side}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selX !== null ? (
          <line
            x1={round2(selX)}
            y1={1}
            x2={round2(selX)}
            y2={height - 1}
            data-mc-ink="accent"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticQuantileDots>
      {geo && geo.threshold && activeThreshold !== undefined ? (
        <span
          className="mc-quantile-dots-readout mc-spark-readout"
          style={{
            left: `${(geo.threshold.x / geo.totalWidth) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${geo.past} in ${geo.count}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
