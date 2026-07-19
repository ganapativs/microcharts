"use client";
// Interactive <DotPlot>. useActivePicker owns interaction: one pointer listener
// + row-by-y-band lookup (rows are the axis here) — ↑/↓ (or ←/→) rove rows,
// announcing each category with its rank ("Ada: 88 — 2nd of 5."); click / Enter
// / Space selects a row (onSelect). Composes the static component (canon) — the
// SVG is never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_CATEGORY, type CategoryStrings } from "../../core/strings-category.js";
import { isFiniteValue } from "../../core/types.js";
import { miniBarSummary } from "../mini-bar/index.js";
import { dotPlotGeometry } from "./geometry.js";
import { DotPlot as StaticDotPlot, type DotPlotProps } from "./index.js";

export interface InteractiveDotPlotProps extends DotPlotProps, PickerProps {
  strings?: CategoryStrings;
  /**
   * Opt-in entrance motion (default `false`): the row dots settle onto the
   * scale on first client-side mount. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
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
    animate = false,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;
  const height = props.height ?? Math.max(16, data.length * 8);

  const hostRef = useRef<HTMLSpanElement>(null);
  // Dots settle onto the scale (the story). With `stem`, the stem line is the
  // magnitude-from-zero channel for each row — it must arrive WITH its dot, not
  // ride the quiet stage ahead of it, so `defer` casts it into the closing act.
  // (No-op when stem is off — its default — since no stem lines exist.)
  useEntrance(hostRef, "settle", animate, { link: 'line[data-mc-ink="muted"]' });

  const fontSize = 6;
  // Label-gutter width, in chars — a full scan of the rows, so it is memoised:
  // the interactive entry re-renders on every unit crossed during a scrub.
  const maxLabelChars = useMemo(
    () =>
      Math.min(
        6,
        data.reduce((m, d) => Math.max(m, d.label.length), 0),
      ),
    [data],
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

  const ranks = useMemo(() => {
    const finite = data
      .map((d, i) => ({ i, v: d.value }))
      .filter((e): e is { i: number; v: number } => isFiniteValue(e.v));
    finite.sort((a, b) => b.v - a.v);
    const map = new Map<number, { rank: number; of: number }>();
    finite.forEach((e, r) => map.set(e.i, { rank: r + 1, of: finite.length }));
    return map;
  }, [data]);

  // Pointer (viewBox space) → row index by pure y-band math (rows are the axis).
  const locate = useCallback(
    (_x: number, y: number) => {
      if (geo.rows.length === 0 || geo.pitch === 0) return null;
      const i = Math.floor(y / geo.pitch);
      return i >= 0 && i < geo.rows.length ? i : null;
    },
    [geo],
  );

  // 1-D roving over rows. The layout is vertical, so ↑/↓ walk rows; ←/→ map to
  // the same prev/next for pointer-free reach. Boundary keys are consumed.
  const step = useCallback(
    (cur: number, key: string) => {
      const n = geo.rows.length;
      if (n === 0) return null;
      switch (key) {
        case "ArrowDown":
        case "ArrowRight":
          return Math.min(n - 1, cur + 1);
        case "ArrowUp":
        case "ArrowLeft":
          return cur <= 0 ? 0 : cur - 1;
        case "Home":
          return 0;
        case "End":
          return n - 1;
      }
      return null;
    },
    [geo],
  );

  // index = ROW (category) index; value = the row's dot value (null when empty).
  const datum = useCallback(
    (i: number) => {
      const d = data[i];
      return { index: i, value: isFiniteValue(d?.value) ? d!.value : null, label: d?.label };
    },
    [data],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.rows.length,
    width,
    height,
    locate,
    step,
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
        : miniBarSummary(data, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // Accent ring hugging a whole row's dot. Transient for hover/focus; a
  // distinguishing `data-mc-w="tick"` marks the persistent pinned selection.
  const ring = (i: number, pinned: boolean) => {
    const row = geo.rows[i];
    if (!row || row.x === null) return null;
    return (
      <circle
        cx={row.x}
        cy={row.y}
        r={3.25}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const shownRow = shown !== null ? geo.rows[shown] : undefined;
  const shownDatum = shown !== null ? data[shown] : undefined;
  const announced =
    shownDatum === undefined
      ? ""
      : isFiniteValue(shownDatum.value)
        ? strings.category(
            shownDatum.label,
            fmt(shownDatum.value),
            ranks.get(shown!)?.rank ?? 0,
            ranks.get(shown!)?.of ?? 0,
          )
        : `${shownDatum.label}: ${strings.noData}`;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-dotplot-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      {...bind}
    >
      <StaticDotPlot
        {...rest}
        style={FILL}
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
        {/* Pinned selection persists through pointer-leave; focus ring is transient. */}
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticDotPlot>
      <LiveRegion>{announced}</LiveRegion>
      {shownRow && shownDatum && isFiniteValue(shownDatum.value) && shownRow.x !== null ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(shownRow.x / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${shownDatum.label}: ${fmt(shownDatum.value)}`}
        </span>
      ) : null}
    </span>
  );
}
