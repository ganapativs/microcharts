"use client";
// Interactive <Ohlc> (plan/22 #24). Nearest-x lookup; ←/→ steps the RENDERED
// periods ("Period 18 of 20: open 145.10, high 149.30, low 144.00, close
// 148.20."). Composes the static component (canon).
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_OHLC, type OhlcStrings } from "../../core/strings-ohlc.js";
import { ohlcGeometry } from "./geometry.js";
import { Ohlc as StaticOhlc, ohlcSummary, type OhlcProps } from "./index.js";

export interface InteractiveOhlcProps extends OhlcProps {
  strings?: OhlcStrings;
}

export function Ohlc(props: InteractiveOhlcProps): React.ReactNode {
  const {
    data,
    variant = "candle",
    maxPeriods = 20,
    label = "none",
    domain,
    width = 80,
    height = 16,
    format,
    locale,
    strings = EN_OHLC,
    title,
    summary,
    ...rest
  } = props;

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const pctFmt = useMemo(
    () => makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 1 }),
    [format, locale],
  );
  const fontSize = Math.max(5, Math.min(Math.round(height * 0.4), 7));
  const lastClose = data.at(-1)?.close;
  const geo = useMemo(
    () =>
      ohlcGeometry({
        width,
        height,
        periods: data,
        maxPeriods,
        domain,
        gutterCh:
          label === "last" && Number.isFinite(lastClose) ? fmt(lastClose as number).length : 0,
        fontSize,
      }),
    [width, height, data, maxPeriods, domain, label, lastClose, fmt, fontSize],
  );
  const rendered = useMemo(
    () => (data.length > maxPeriods ? data.slice(-maxPeriods) : [...data]),
    [data, maxPeriods],
  );
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : ohlcSummary(data, fmt, pctFmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.marks.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      let best = 0;
      let bestDist = Infinity;
      geo.marks.forEach((m, i) => {
        const dist = Math.abs(m.x - x);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    },
    [geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.marks.length === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(geo.marks.length - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.marks.length - 1;
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

  const mark = active !== null ? geo.marks[active] : undefined;
  const period = mark ? rendered[mark.index] : undefined;
  const announced =
    mark && period
      ? strings.ohlcAt(
          mark.index + 1,
          geo.marks.length,
          fmt(period.open),
          fmt(period.high),
          fmt(period.low),
          fmt(period.close),
        )
      : "";

  return (
    <span
      className="mc-ohlc-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticOhlc
        {...rest}
        data={data}
        variant={variant}
        maxPeriods={maxPeriods}
        label={label}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {mark ? (
          <rect
            x={mark.x - mark.bodyW / 2 - 1}
            y={0.5}
            width={mark.bodyW + 2}
            height={height - 1}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticOhlc>
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
      {mark && period ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(mark.x / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {fmt(period.close)}
        </span>
      ) : null}
    </span>
  );
}
