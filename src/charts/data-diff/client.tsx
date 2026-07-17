"use client";
// Interactive <DataDiff>. One pointer listener + grid lookup
// (pointer y → row). ↑/↓ step rows, Home/End jump. The live region states each
// row's added / removed / net. Composes the static component (canon); the focus
// ring + readout chip are overlay children.
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
import { EN_DATA_DIFF, type DataDiffStrings } from "../../core/strings-data-diff.js";
import { dataDiffGeometry } from "./geometry.js";
import { DataDiff as StaticDataDiff, dataDiffSummary, type DataDiffProps } from "./index.js";

export interface InteractiveDataDiffProps extends DataDiffProps {
  strings?: DataDiffStrings;
  /**
   * Opt-in entrance motion (default `false`): rows pop in top-to-bottom
   * sequence when the chart first mounts client-side. Inert on the server
   * and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const signed = (n: number, fmt: (v: number) => string): string =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n))}`;

export function DataDiff(props: InteractiveDataDiffProps): React.ReactNode {
  const {
    data,
    sort = "none",
    domain,
    max = 12,
    format,
    locale,
    width = 80,
    height = 20,
    strings = EN_DATA_DIFF,
    title,
    summary,
    animate = false,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // Rows are never merged — each row draws its own removed/added rects (plus
  // an occasional 0/0 placeholder or opt-in net tick), all sharing that row's
  // y. Diverging bars are anchored at the zero axis, so they must GROW FROM
  // ZERO, not pop from their own center: "sweep" + origin "signed" pins each
  // mark's growth edge to the axis (negative ink extends leftward from centerX,
  // positive rightward). "order: y" still lands them row by row, top to bottom.
  // `rect[data-mc-ink]` covers every row mark (negative/positive/neutral) and
  // nothing else (the zero hairline is a <line>, tags are <text>).
  useEntrance(hostRef, "sweep", animate, {
    selector: "rect[data-mc-ink]",
    origin: "signed",
    order: "y",
  });

  const geo = useMemo(
    () => dataDiffGeometry({ width, height, data, sort, domain, max }),
    [width, height, data, sort, domain, max],
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
          : dataDiffSummary(geo, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const count = geo?.rows.length ?? 0;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo || count === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.height === 0) return;
      const py = ((e.clientY - r.top) / r.height) * height;
      let best = 0;
      let bestDist = Infinity;
      geo.rows.forEach((row, i) => {
        const d = Math.abs(row.y + row.height / 2 - py);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    },
    [geo, count, height],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (count === 0) return;
      switch (e.key) {
        case "ArrowDown":
          setActive((p) => Math.min(count - 1, (p ?? -1) + 1));
          break;
        case "ArrowUp":
          setActive((p) => (p === null || p <= 0 ? 0 : p - 1));
          break;
        case "Home":
          setActive(0);
          break;
        case "End":
          setActive(count - 1);
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
    },
    [count],
  );

  const row = active !== null && geo ? geo.rows[active] : undefined;
  const announced = row
    ? strings.dataDiffAt(row.key, fmt(row.addedValue), fmt(row.removedValue), signed(row.net, fmt))
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
      className={className ? `mc-data-diff-live ${className}` : "mc-data-diff-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticDataDiff
        {...rest}
        style={FILL}
        data={data}
        sort={sort}
        domain={domain}
        max={max}
        format={format}
        locale={locale}
        width={width}
        height={height}
        strings={strings}
        summary={false}
      >
        {row ? (
          <rect
            x={0.5}
            y={row.y - 1}
            width={geo!.totalWidth - 1}
            height={row.height + 2}
            fill="none"
            stroke="var(--mc-accent)"
            strokeWidth={0.8}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticDataDiff>
      {row && geo ? (
        <span
          className="mc-data-diff-readout mc-spark-readout"
          style={{
            left: `${(geo.centerX / geo.totalWidth) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`+${fmt(row.addedValue)} · −${fmt(row.removedValue)}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
