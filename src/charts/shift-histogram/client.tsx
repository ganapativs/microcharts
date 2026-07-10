"use client";
// Interactive <ShiftHistogram> (plan/23 #14). One pointer listener + grid lookup
// (pointer x → bin). ←/→ step bins, M jumps to the two median bins. The live
// region states each bin's before/after proportions. Composes the static
// component (canon); the crosshair + readout chip are overlay children.
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_SHIFT, type ShiftStrings } from "../../core/strings-shift.js";
import { shiftHistogramGeometry } from "./geometry.js";
import {
  ShiftHistogram as StaticShiftHistogram,
  shiftSummary,
  type ShiftHistogramProps,
} from "./index.js";

export interface InteractiveShiftHistogramProps extends ShiftHistogramProps {
  strings?: ShiftStrings;
}

const pct = (share: number): string => `${Math.round(share * 100)}%`;

export function ShiftHistogram(props: InteractiveShiftHistogramProps): React.ReactNode {
  const {
    data,
    bins,
    mode = "mirror",
    labels = ["before", "after"] as const,
    width = 80,
    height = 20,
    format,
    locale,
    strings = EN_SHIFT,
    title,
    summary,
    ...rest
  } = props;

  const geo = useMemo(
    () =>
      shiftHistogramGeometry({
        width,
        height,
        before: data.before,
        after: data.after,
        bins,
        mode,
        domain: props.domain,
      }),
    [width, height, data.before, data.after, bins, mode, props.domain],
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
          : shiftSummary(geo, fmt, labels, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const count = geo?.bins.length ?? 0;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo || count === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const px = ((e.clientX - r.left) / r.width) * geo.totalWidth;
      let best = 0;
      let bestDist = Infinity;
      geo.bins.forEach((b, i) => {
        const d = Math.abs(b.x + b.width / 2 - px);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    },
    [geo, count],
  );

  const medianBins = useMemo(() => {
    if (!geo) return [] as number[];
    const idx = (x: number | undefined) =>
      x === undefined ? -1 : geo.bins.findIndex((b) => x >= b.x && x <= b.x + b.width);
    return [idx(geo.medians.before?.x), idx(geo.medians.after?.x)].filter((i) => i >= 0);
  }, [geo]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (count === 0) return;
      switch (e.key) {
        case "ArrowRight":
          setActive((p) => Math.min(count - 1, (p ?? -1) + 1));
          break;
        case "ArrowLeft":
          setActive((p) => (p === null || p <= 0 ? 0 : p - 1));
          break;
        case "Home":
          setActive(0);
          break;
        case "End":
          setActive(count - 1);
          break;
        case "m":
        case "M":
          if (medianBins.length)
            setActive((p) => {
              const cur = medianBins.indexOf(p ?? -1);
              return medianBins[(cur + 1) % medianBins.length]!;
            });
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
    },
    [count, medianBins],
  );

  const b = active !== null && geo ? geo.bins[active] : undefined;
  const announced = b
    ? strings.shiftBin(fmt(b.x0), fmt(b.x1), pct(b.beforeShare), pct(b.afterShare))
    : "";

  return (
    <span
      className="mc-shift-histogram-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticShiftHistogram
        {...rest}
        data={data}
        bins={bins}
        mode={mode}
        labels={labels}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {b ? (
          <rect
            x={b.x - 0.6}
            y={0.5}
            width={b.width + 1.2}
            height={height - 1}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticShiftHistogram>
      {b && geo ? (
        <span
          className="mc-shift-readout mc-spark-readout"
          style={{
            left: `${((b.x + b.width / 2) / geo.totalWidth) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${pct(b.beforeShare)} / ${pct(b.afterShare)}`}
        </span>
      ) : null}
      <span
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {announced}
      </span>
    </span>
  );
}
