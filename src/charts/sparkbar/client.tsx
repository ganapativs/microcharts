"use client";
// Interactive <SparkBar> (plan/04 §4, plan/08 T2). Keyboard + pointer bar
// navigation with a polite live readout, roving focus on an HTML overlay. The
// visual layer matches the static entry; only behavior is layered on.
import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { describeSeries } from "../../core/summary.js";
import { isFiniteValue } from "../../core/types.js";
import { sparkBarGeometry, type Bar, type SparkBarMode } from "./geometry.js";
import type { SparkBarProps } from "./index.js";

function barInk(bar: Bar, mode: SparkBarMode, activeIndex: number | null): string {
  if (bar.index === activeIndex) return "accent";
  if (mode === "winloss" || bar.sign < 0) return bar.sign < 0 ? "negative" : "positive";
  return bar.last ? "accent" : "bar";
}

export interface InteractiveSparkBarProps extends SparkBarProps {
  onPointFocus?: (index: number | null) => void;
}

export function SparkBar(props: InteractiveSparkBarProps): React.ReactNode {
  const {
    data,
    domain,
    width = 80,
    height = 20,
    mode = "bar",
    gap = 0.25,
    color,
    title,
    summary,
    format,
    locale,
    onPointFocus,
    className,
    style,
    children,
  } = props;

  const geo = useMemo(
    () => sparkBarGeometry(data, { width, height, mode, domain, gap }),
    [data, width, height, mode, domain, gap],
  );
  const stops = useMemo(() => geo.bars.map((b) => b.index), [geo]);
  const [active, setActive] = useState<number | null>(null);

  const fmt = useMemo(
    () =>
      typeof format === "function"
        ? format
        : (n: number) => new Intl.NumberFormat(locale, format).format(n),
    [format, locale],
  );

  const move = useCallback(
    (next: number | null) => {
      setActive(next);
      onPointFocus?.(next);
    },
    [onPointFocus],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (stops.length === 0) return;
      const pos = active === null ? -1 : stops.indexOf(active);
      let target = pos;
      switch (e.key) {
        case "ArrowRight":
          target = Math.min(stops.length - 1, pos + 1);
          break;
        case "ArrowLeft":
          target = pos <= 0 ? 0 : pos - 1;
          break;
        case "Home":
          target = 0;
          break;
        case "End":
          target = stops.length - 1;
          break;
        case "Escape":
          move(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      move(stops[target]!);
    },
    [active, stops, move],
  );

  const accName =
    summary === false ? undefined : (summary ?? describeSeries(data, { format, locale }));
  const activeBar = active !== null ? geo.bars.find((b) => b.index === active) : undefined;
  const activeValue = activeBar && isFiniteValue(activeBar.value) ? activeBar.value : null;

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      className={className ? `mc-sparkbar-interactive ${className}` : "mc-sparkbar-interactive"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={[title, accName].filter(Boolean).join(". ") || undefined}
      onKeyDown={onKeyDown}
      onBlur={() => move(null)}
    >
      <svg
        className="mc-root"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {geo.bars.map((bar) => (
          <rect
            key={bar.index}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            shapeRendering="crispEdges"
            data-mc-ink={barInk(bar, mode, active)}
            style={color && barInk(bar, mode, active) === "bar" ? { fill: color } : undefined}
          />
        ))}
        {children}
      </svg>
      <span aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
        {geo.bars.map((bar) => (
          <span
            key={bar.index}
            onPointerEnter={() => move(bar.index)}
            onPointerLeave={() => move(null)}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${(bar.x / width) * 100}%`,
              width: `${(bar.width / width) * 100}%`,
            }}
          />
        ))}
      </span>
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
        {activeValue !== null ? `Bar ${active! + 1}: ${fmt(activeValue)}` : ""}
      </span>
      {activeBar && activeValue !== null ? (
        <span
          className="mc-spark-readout"
          style={{
            position: "absolute",
            left: `${((activeBar.x + activeBar.width / 2) / width) * 100}%`,
            bottom: "100%",
            transform: "translateX(-50%)",
            font: "var(--mc-label-size, 0.75em) var(--mc-font, inherit)",
            fontVariantNumeric: "tabular-nums",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {fmt(activeValue)}
        </span>
      ) : null}
    </span>
  );
}
