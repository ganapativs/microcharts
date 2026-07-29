"use client";
// Interactive <ABStrips>. useActivePicker owns interaction: y picks the row,
// x snaps to the nearest quantile edge; ↑/↓ switch rows (keeping the edge). ←/→
// step edges; click / Enter / Space selects (onSelect). The median edge
// announces the row median + delta vs the other arm; other edges announce
// percentile.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, makePercentFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  rowReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_AB, type ABStrings } from "../../core/strings-ab.js";
import { labelFont, labelFitsBand } from "../../core/labels.js";
import { abStripsGeometry, abTagChars } from "./geometry.js";
import { ABStrips as StaticABStrips, abSummary, abDelta, type ABStripsProps } from "./index.js";

export interface InteractiveABStripsProps extends ABStripsProps, PickerProps {
  strings?: ABStrings;
  /**
   * Opt-in entrance motion (default `false`): the two median dots settle onto
   * their bands on first client-side mount. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

/** Quantile edges per row (p5/25/50/75/95) — the navigable stops. */
const EDGES = 5;

export function ABStrips(props: InteractiveABStripsProps): React.ReactNode {
  const {
    data,
    seriesLabels = ["A", "B"] as const,
    width = 80,
    height = 20,
    format,
    locale,
    strings = EN_AB,
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
  useEntrance(hostRef, "settle", animate, { selector: "circle[data-mc-ink]" });

  // Mirror the static's drop rules exactly (row tags AND the delta): each one
  // that drops takes its gutter with it, so a copy that kept reserving would
  // stretch `totalWidth` past the composed static's viewBox and slide the
  // pointer map off the marks.
  const FONT = labelFont(height, 0.3);
  const labelChars = abTagChars({ width, height, fontSize: FONT, labels: seriesLabels });
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Same percent formatter the static builds — the gutter is measured off its
  // output, so a locale that widens it (fr-FR "+15 %") must widen it identically
  // in both entries or the pointer map runs short of the rendered viewBox.
  const pctFmt = useMemo(() => makePercentFormatter(locale), [locale]);
  // Mirror the static's label gutter so `totalWidth` matches the rendered
  // viewBox — without it the pointer map and readout run short and the
  // crosshair drifts from the cursor.
  const geo = useMemo(() => {
    const base = abStripsGeometry({
      width,
      height,
      a: data.a,
      b: data.b,
      labelChars,
      domain: props.domain,
      fontSize: FONT,
    });
    const showLabel =
      (props.label ?? "delta") === "delta" && base != null && labelFitsBand(height, FONT);
    const gutterCh = showLabel ? abDelta(base!, fmt, pctFmt).length : 0;
    return abStripsGeometry({
      width,
      height,
      a: data.a,
      b: data.b,
      labelChars,
      domain: props.domain,
      gutterCh,
      fontSize: FONT,
    });
  }, [width, height, data.a, data.b, labelChars, props.domain, props.label, fmt, pctFmt, FONT]);

  // Navigable unit = one quantile edge of one row: index `row * 5 + edge`
  // (row 0 = arm A, row 1 = arm B; edge 0…4 = p5/p25/p50/p75/p95). The chart
  // rolls a whole sample up into five edges, so this is NOT a data index.
  const edgeAt = useCallback(
    (i: number) => {
      const r = geo?.rows[Math.floor(i / EDGES)];
      return r ? { row: r, edge: r.edges[i % EDGES]! } : undefined;
    },
    [geo],
  );

  const locate = useCallback(
    (x: number, y: number) => {
      if (!geo) return null;
      const row = y < height / 2 ? 0 : 1;
      const edges = geo.rows[row]!.edges;
      let best = 0;
      let bestDist = Infinity;
      edges.forEach((ed, i) => {
        const d = Math.abs(ed.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return row * EDGES + best;
    },
    [geo, height],
  );

  // 2-D roving: ←/→ walk the edges of the current row, ↑/↓ swap arms keeping the
  // edge. All four arrows are intercepted (a fall-through to nav1d would step
  // sideways across the row boundary). From nothing, ↑/↓ land on the median.
  const step = useCallback((cur: number, key: string) => {
    const row = cur < 0 ? 0 : Math.floor(cur / EDGES);
    const edge = cur < 0 ? -1 : cur % EDGES;
    switch (key) {
      case "ArrowRight":
        return row * EDGES + Math.min(EDGES - 1, edge + 1);
      case "ArrowLeft":
        return row * EDGES + (edge <= 0 ? 0 : edge - 1);
      case "ArrowUp":
        return cur < 0 ? 2 : edge;
      case "ArrowDown":
        return EDGES + (cur < 0 ? 2 : edge);
      case "Home":
        return row * EDGES;
      case "End":
        return row * EDGES + EDGES - 1;
    }
    return null;
  }, []);

  // `value` = the quantile value at that edge (the number the strip encodes on
  // the shared x scale); the arm + percentile ride along in `label`, and the
  // cross-arm delta stays in the readout/announcement.
  const datum = useCallback(
    (i: number) => {
      const e = edgeAt(i);
      return {
        index: i,
        value: e?.edge.value ?? null,
        label: e ? `${seriesLabels[Math.floor(i / EDGES)]!} p${e.edge.p}` : undefined,
        formatted: e
          ? `${seriesLabels[Math.floor(i / EDGES)]!} p${e.edge.p} ${fmt(e.edge.value)}`
          : undefined,
      };
    },
    [edgeAt, seriesLabels, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo ? EDGES * 2 : 0,
    width: geo?.totalWidth ?? width,
    height,
    locate,
    datum,
    step,
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
        : geo === null
          ? strings.noData
          : abSummary(geo, fmt, seriesLabels, strings, pctFmt);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const dot = (i: number, pinned: boolean) => {
    const e = edgeAt(i);
    if (!e) return null;
    return (
      <circle
        cx={e.edge.x}
        cy={e.row.y}
        r={2.6}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const at = shown !== null ? edgeAt(shown) : undefined;
  const shownRow = shown !== null ? Math.floor(shown / EDGES) : 0;
  const announced =
    at && geo
      ? at.edge.p === 50
        ? strings.abRow(
            seriesLabels[shownRow]!,
            fmt(at.edge.value),
            fmt(Math.abs(geo.deltaMedian)),
            geo.deltaMedian < 0 ? "below" : "above",
            seriesLabels[shownRow === 0 ? 1 : 0]!,
          )
        : strings.abEdge(seriesLabels[shownRow]!, at.edge.p, fmt(at.edge.value))
      : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-ab-strips-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticABStrips
        {...rest}
        style={fillFor(style)}
        data={data}
        seriesLabels={seriesLabels}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? dot(selected, true) : null}
        {active !== null ? dot(active, false) : null}
        {rest.children}
      </StaticABStrips>
      {readout && at && geo ? (
        <span
          className="mc-ab-strips-readout mc-spark-readout"
          style={rowReadoutStyle(
            at.edge.x,
            geo.rows[shownRow]?.y ?? height / 2,
            geo.totalWidth,
            height,
          )}
        >
          {/* One terse form for every edge, median included. The median branch
              used to spell out the whole cross-arm comparison here — and the
              comparison words were hardcoded English, unlike the live region
              beside it, which builds the same sentence through `strings.abRow`.
              The chip names the edge and its value; the comparison stays in the
              announcement, already localized. */}
          {`${seriesLabels[shownRow]!} p${at.edge.p} ${fmt(at.edge.value)}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
