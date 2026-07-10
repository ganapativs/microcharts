"use client";
// Interactive <DotPlot> (plan/22 #10). One pointer listener; row by y-band
// lookup (rows are the axis here) — ↑/↓ rove rows, announcing each category
// with its rank ("Ada: 88 — 2nd of 5."). Composes the static component.
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_CATEGORY, type CategoryStrings } from "../../core/strings-category.js";
import { isFiniteValue } from "../../core/types.js";
import { miniBarSummary } from "../mini-bar/index.js";
import { dotPlotGeometry } from "./geometry.js";
import { DotPlot as StaticDotPlot, type DotPlotProps } from "./index.js";

export interface InteractiveDotPlotProps extends DotPlotProps {
  strings?: CategoryStrings;
}

export function DotPlot(props: InteractiveDotPlotProps): React.ReactNode {
  const {
    data,
    stem = false,
    domain,
    width = 60,
    format,
    locale,
    strings = EN_CATEGORY,
    title,
    summary,
    ...rest
  } = props;
  const height = props.height ?? Math.max(16, data.length * 8);

  const fontSize = 6;
  const maxLabelChars = Math.min(
    6,
    data.reduce((m, d) => Math.max(m, d.label.length), 0),
  );
  const geo = useMemo(
    () =>
      dotPlotGeometry({
        width,
        height,
        values: data.map((d) => d.value),
        domain,
        gutterCh: maxLabelChars > 0 ? maxLabelChars + 1 : 0,
        fontSize,
        stem,
      }),
    [width, height, data, domain, maxLabelChars, stem],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const ranks = useMemo(() => {
    const finite = data
      .map((d, i) => ({ i, v: d.value }))
      .filter((e): e is { i: number; v: number } => isFiniteValue(e.v));
    finite.sort((a, b) => b.v - a.v);
    const map = new Map<number, { rank: number; of: number }>();
    finite.forEach((e, r) => map.set(e.i, { rank: r + 1, of: finite.length }));
    return map;
  }, [data]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : miniBarSummary(data, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.rows.length === 0 || geo.pitch === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.height === 0) return;
      const y = ((e.clientY - r.top) / r.height) * height;
      const i = Math.floor(y / geo.pitch);
      setActive(i >= 0 && i < geo.rows.length ? i : null);
    },
    [geo, height],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.rows.length === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
          next = Math.min(geo.rows.length - 1, cur + 1);
          break;
        case "ArrowUp":
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.rows.length - 1;
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

  const activeRow = active !== null ? geo.rows[active] : undefined;
  const activeDatum = active !== null ? data[active] : undefined;
  const announced =
    activeDatum === undefined
      ? ""
      : isFiniteValue(activeDatum.value)
        ? strings.category(
            activeDatum.label,
            fmt(activeDatum.value),
            ranks.get(active!)?.rank ?? 0,
            ranks.get(active!)?.of ?? 0,
          )
        : `${activeDatum.label}: ${strings.noData}`;

  return (
    <span
      className="mc-dotplot-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticDotPlot
        {...rest}
        data={data}
        stem={stem}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {activeRow && activeRow.x !== null ? (
          <circle
            cx={activeRow.x}
            cy={activeRow.y}
            r={3.25}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticDotPlot>
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
      {activeRow && activeDatum && isFiniteValue(activeDatum.value) && activeRow.x !== null ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(activeRow.x / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {fmt(activeDatum.value)}
        </span>
      ) : null}
    </span>
  );
}
