"use client";
// Interactive <QuantileDots> — the probe. Pointer x moves a live
// threshold; the count past it recomputes purely. ←/→ nudge the probe one bin,
// Enter announces, Esc returns to the prop threshold. Composes the static
// component with the live threshold (canon); the readout chip reports the odds.
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
import { EN_QUANTILE_DOTS, type QuantileDotsStrings } from "../../core/strings-quantile-dots.js";
import { labelFont } from "../../core/labels.js";
import { quantileDotsGeometry } from "./geometry.js";
import { QuantileDots as StaticQuantileDots, type QuantileDotsProps } from "./index.js";

export interface InteractiveQuantileDotsProps extends QuantileDotsProps {
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
  // probe value overrides the prop threshold; null ⇒ use the prop threshold
  const [probe, setProbe] = useState<number | null>(null);
  const activeThreshold = probe ?? threshold;

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

  // clamp to the data range AND round to 2 dp so the live threshold reads clean
  const clampVal = useCallback(
    (v: number): number => {
      const c = geo ? Math.max(geo.x0, Math.min(geo.x0 + geo.range, v)) : v;
      return Math.round(c * 100) / 100;
    },
    [geo],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || geo.range === 0) return;
      const px = ((e.clientX - r.left) / r.width) * geo.totalWidth;
      const frac = (px - geo.pad) / (width - 2 * geo.pad);
      setProbe(clampVal(geo.x0 + Math.max(0, Math.min(1, frac)) * geo.range));
    },
    [geo, width, clampVal],
  );

  const step = geo && geo.columns > 0 ? geo.range / geo.columns : 1;
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!geo) return;
      switch (e.key) {
        case "ArrowRight":
          setProbe((prev) => clampVal((prev ?? threshold ?? geo.x0) + step));
          break;
        case "ArrowLeft":
          setProbe((prev) => clampVal((prev ?? threshold ?? geo.x0 + geo.range) - step));
          break;
        case "Escape":
          setProbe(null);
          return;
        case "Enter":
          break;
        default:
          return;
      }
      e.preventDefault();
    },
    [geo, step, threshold, clampVal],
  );

  const announced =
    geo && activeThreshold !== undefined && Number.isFinite(activeThreshold)
      ? strings.quantileDots(geo.past, geo.count, side, fmt(activeThreshold))
      : "";

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      ref={hostRef}
      className={className ? `mc-quantile-dots-live ${className}` : "mc-quantile-dots-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setProbe(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setProbe(null)}
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
