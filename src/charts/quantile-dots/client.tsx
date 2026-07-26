"use client";
// Interactive <QuantileDots> — the probe. Pointer x moves a live threshold and
// the count past it recomputes purely; ←/→ step it one quantile bin, Enter /
// Space / click pins a bin, Esc returns to the prop threshold. useActivePicker
// owns interaction.
// Layout is frozen: the composed static uses `label="none"` so the viewBox
// never grows/shrinks with the live "N in count" string (that reflow was
// gallery bug — hit targets drifted and the plate shifted under the cursor).
// Idle odds sit in an HTML gutter beside the SVG; the probe chip covers hover.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
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
import { EN_QUANTILE_DOTS, type QuantileDotsStrings } from "../../core/strings-quantile-dots.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { quantileDotplot } from "../../core/quantile.js";
import { round2 } from "../../core/types.js";
import { quantileDotsGeometry } from "./geometry.js";
import {
  QuantileDots as StaticQuantileDots,
  quantileDotsSummary,
  type QuantileDotsProps,
} from "./index.js";

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
  useEntrance(hostRef, "trail", animate, {
    selector: '[data-mc-ink="neutral"], [data-mc-ink="flag"]',
    order: "x",
  });

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const pad = 2;

  const dotCount = Math.max(1, Math.min(25, Math.round(count ?? 20)));
  const plot = useMemo(() => quantileDotplot(data, dotCount), [data, dotCount]);
  const columns = plot?.columns ?? 0;
  const colCounts = useMemo(() => {
    const c = Array.from<number>({ length: columns }).fill(0);
    if (plot) for (const d of plot.dots) c[d.column] = (c[d.column] ?? 0) + 1;
    return c;
  }, [plot, columns]);
  const binLo = useCallback(
    (i: number) => (plot ? round2(plot.x0 + i * plot.binWidth) : undefined),
    [plot],
  );

  // Standard viewBox mapping — SVG width is the plot `width` (no live gutter).
  const locate = useCallback(
    (x: number) => {
      if (columns === 0) return null;
      const t = ((x - pad) / (width - 2 * pad)) * columns;
      return Math.max(0, Math.min(columns - 1, Math.floor(t)));
    },
    [columns, width],
  );

  const datum = useCallback(
    (i: number) => {
      const lo = binLo(i);
      const mass = colCounts[i] ?? 0;
      // Mirror the probe chip: "<past> in <count> <side> <threshold>", where the
      // live threshold is this bin's lower edge (Number-finite `binLo` falls back
      // to the prop threshold, exactly like `activeThreshold`).
      const th = lo ?? threshold;
      const formatted =
        plot && th !== undefined && Number.isFinite(th)
          ? strings.quantileDotsChip(
              plot.dots.filter((d) => (side === "above" ? d.value > th : d.value < th)).length,
              dotCount,
              side,
              fmt(th),
            )
          : undefined;
      return {
        index: i,
        value: mass > 0 ? mass : null,
        label:
          lo === undefined ? undefined : `${fmt(lo)}–${fmt(round2(lo + (plot?.binWidth ?? 0)))}`,
        formatted,
      };
    },
    [binLo, colCounts, fmt, plot, threshold, side, dotCount, strings],
  );

  const { active, selected, bind } = useActivePicker({
    count: columns,
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
  const activeThreshold = (shown !== null ? binLo(shown) : undefined) ?? threshold;

  const geo = useMemo(
    () =>
      quantileDotsGeometry({
        width,
        height,
        data,
        count,
        threshold: activeThreshold,
        side,
        domain: props.domain,
      }),
    [width, height, data, count, activeThreshold, side, props.domain],
  );

  const staticGeo = useMemo(
    () =>
      quantileDotsGeometry({ width, height, data, count, threshold, side, domain: props.domain }),
    [width, height, data, count, threshold, side, props.domain],
  );
  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : staticGeo === null
          ? strings.noData
          : quantileDotsSummary(staticGeo, fmt, { threshold, side }, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const announced =
    shown !== null && geo && activeThreshold !== undefined && Number.isFinite(activeThreshold)
      ? strings.quantileDots(geo.past, geo.count, side, fmt(activeThreshold))
      : "";

  const selLo = selected !== null && selected !== active ? binLo(selected) : undefined;
  const selX =
    geo && selLo !== undefined
      ? geo.range === 0
        ? geo.pad + (width - 2 * geo.pad) / 2
        : geo.pad + Math.max(0, Math.min(1, (selLo - geo.x0) / geo.range)) * (width - 2 * geo.pad)
      : null;

  const showIdleOdds =
    (props.label ?? "count") === "count" &&
    threshold !== undefined &&
    Number.isFinite(threshold) &&
    staticGeo != null &&
    labelFitsY(height / 2, labelFont(height), height);
  const idleOdds =
    showIdleOdds && staticGeo ? strings.quantileDotsOdds(staticGeo.past, staticGeo.count) : null;
  const oddsHidden = shown !== null;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-quantile-dots-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35em" }}>
        <span style={{ position: "relative", display: "inline-block", lineHeight: 0 }}>
          <StaticQuantileDots
            {...rest}
            style={fillFor(style)}
            data={data}
            count={count}
            threshold={activeThreshold}
            side={side}
            width={width}
            height={height}
            format={format}
            locale={locale}
            strings={strings}
            label="none"
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
          {readout && shown !== null && geo && geo.threshold && activeThreshold !== undefined ? (
            <span
              className="mc-quantile-dots-readout mc-spark-readout"
              style={crosshairReadoutStyle(geo.threshold.x, width)}
            >
              {strings.quantileDotsChip(geo.past, geo.count, side, fmt(activeThreshold))}
            </span>
          ) : null}
        </span>
        {idleOdds ? (
          <span
            className="mc-quantile-dots-odds"
            aria-hidden
            style={{
              font: `${labelFont(height)}px var(--mc-font, inherit)`,
              fontVariantNumeric: "tabular-nums",
              color: "var(--mc-neutral)",
              lineHeight: 1,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              // Keep the gutter reserved while probing so the plate never
              // shifts under the cursor when idle odds hide.
              visibility: oddsHidden ? "hidden" : "visible",
            }}
          >
            {idleOdds}
          </span>
        ) : null}
      </span>
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
