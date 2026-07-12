"use client";
// Interactive <ABStrips>. One pointer listener: y picks the row,
// x snaps to the nearest quantile edge. ↑/↓ switch rows, ←/→ step edges. The
// median edge announces the row median + delta vs the other arm; other edges
// announce the percentile. Composes the static component (canon).
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_AB, type ABStrings } from "../../core/strings-ab.js";
import { abStripsGeometry } from "./geometry.js";
import { ABStrips as StaticABStrips, abSummary, type ABStripsProps } from "./index.js";

export interface InteractiveABStripsProps extends ABStripsProps {
  strings?: ABStrings;
  /**
   * Opt-in entrance motion (default `false`): the two median dots settle onto
   * their bands on first client-side mount. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function ABStrips(props: InteractiveABStripsProps): React.ReactNode {
  const {
    data,
    labels = ["A", "B"] as const,
    width = 80,
    height = 20,
    format,
    locale,
    strings = EN_AB,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "settle", animate, { selector: "circle[data-mc-ink]" });

  const labelChars = Math.max(labels[0].length, labels[1].length);
  const geo = useMemo(
    () =>
      abStripsGeometry({ width, height, a: data.a, b: data.b, labelChars, domain: props.domain }),
    [width, height, data.a, data.b, labelChars, props.domain],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [sel, setSel] = useState<{ row: number; edge: number } | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : abSummary(geo, fmt, labels, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const px = ((e.clientX - r.left) / r.width) * geo.totalWidth;
      const py = ((e.clientY - r.top) / r.height) * height;
      const row = py < height / 2 ? 0 : 1;
      const edges = geo.rows[row]!.edges;
      let best = 0;
      let bestDist = Infinity;
      edges.forEach((ed, i) => {
        const d = Math.abs(ed.x - px);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setSel({ row, edge: best });
    },
    [geo, height],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!geo) return;
      switch (e.key) {
        case "ArrowRight":
          setSel((p) => ({ row: p?.row ?? 0, edge: Math.min(4, (p?.edge ?? -1) + 1) }));
          break;
        case "ArrowLeft":
          setSel((p) => ({ row: p?.row ?? 0, edge: p === null || p.edge <= 0 ? 0 : p.edge - 1 }));
          break;
        case "ArrowUp":
          setSel((p) => ({ row: 0, edge: p?.edge ?? 2 }));
          break;
        case "ArrowDown":
          setSel((p) => ({ row: 1, edge: p?.edge ?? 2 }));
          break;
        case "Escape":
          setSel(null);
          return;
        default:
          return;
      }
      e.preventDefault();
    },
    [geo],
  );

  const active = sel && geo ? geo.rows[sel.row]!.edges[sel.edge]! : undefined;
  const activeRow = sel?.row ?? 0;
  const announced =
    active && geo
      ? active.p === 50
        ? strings.abRow(
            labels[activeRow]!,
            fmt(active.value),
            fmt(Math.abs(geo.deltaMedian)),
            geo.deltaMedian < 0 ? "below" : "above",
            labels[activeRow === 0 ? 1 : 0]!,
          )
        : strings.abEdge(labels[activeRow]!, active.p, fmt(active.value))
      : "";

  return (
    <span
      ref={hostRef}
      className="mc-ab-strips-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setSel(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setSel(null)}
    >
      <StaticABStrips
        {...rest}
        data={data}
        labels={labels}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {active && geo ? (
          <circle
            cx={active.x}
            cy={geo.rows[activeRow]!.y}
            r={2.6}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticABStrips>
      {active && geo ? (
        <span
          className="mc-ab-strips-readout mc-spark-readout"
          style={{ left: `${(active.x / geo.totalWidth) * 100}%`, transform: "translateX(-50%)" }}
        >
          {active.p === 50 ? fmt(active.value) : `p${active.p} ${fmt(active.value)}`}
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
