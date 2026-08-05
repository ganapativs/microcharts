"use client";
// Interactive <DataDiff>. useActivePicker owns interaction: one pointer
// listener + grid lookup (pointer y → row). ↑/↓ (and ←/→) step rows, Home/End
// jump, click / Enter / Space selects (onSelect). The live region states each
// row's added / removed / net.focus
// ring + readout chip are overlay children.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, withPlus } from "../../core/format.js";
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
import { EN_DATA_DIFF, type DataDiffStrings } from "../../core/strings-data-diff.js";
import { dataDiffGeometry, dataDiffLayout } from "./geometry.js";
import { DataDiff as StaticDataDiff, dataDiffSummary, type DataDiffProps } from "./index.js";

export interface InteractiveDataDiffProps extends DataDiffProps, PickerProps {
  strings?: DataDiffStrings;
  /**
   * Opt-in entrance motion (default `false`): each row's bars sweep out from the
   * zero line — removed leftward, added rightward — row by row, top to bottom,
   * when the chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const signed = (n: number, fmt: (v: number) => string): string =>
  n < 0 ? `−${fmt(Math.abs(n))}` : n === 0 ? fmt(0) : withPlus(n, (v) => fmt(Math.abs(v)));

export function DataDiff(props: InteractiveDataDiffProps): React.ReactNode {
  const {
    data,
    labels = false,
    label = "none",
    order = "data",
    domain,
    maxItems = 12,
    format,
    locale,
    width = 80,
    height = 20,
    strings = EN_DATA_DIFF,
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

  // Mirror the static's tag gutter + totals footer exactly — they move the row
  // band and centerX, so omitting them slides the focus ring off the rows.
  const geo = useMemo(() => {
    const { footer, tagFont, keyChars } = dataDiffLayout({
      data,
      labels,
      label,
      maxItems,
      width,
      height,
    });
    return dataDiffGeometry({
      width,
      height,
      data,
      order,
      domain,
      maxItems,
      gutterCh: tagFont > 0 ? keyChars : 0,
      fontSize: tagFont,
      footer,
    });
  }, [width, height, data, order, domain, maxItems, labels, label]);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // Navigable unit = one DISPLAYED row: index into `geo.rows`, i.e. the sorted +
  // `maxItems`-capped view order, which is the data order only when order === "data".
  const count = geo?.rows.length ?? 0;

  const locate = useCallback(
    (_x: number, y: number) => {
      if (!geo || count === 0) return null;
      let best = 0;
      let bestDist = Infinity;
      geo.rows.forEach((row, i) => {
        const d = Math.abs(row.y + row.height / 2 - y);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [geo, count],
  );

  // `value` = the row's signed net (added − removed) — the one number the
  // diverging pair resolves to; the two magnitudes stay in the readout chip and
  // the announcement, which state added / removed / net in full.
  const datum = useCallback(
    (i: number) => {
      const r = geo?.rows[i];
      return {
        index: i,
        value: r?.net ?? null,
        label: r?.key,
        formatted: r
          ? `${r.key}: +${fmt(r.addedValue)} · −${fmt(r.removedValue)} (${signed(r.net, fmt)})`
          : "",
      };
    },
    [geo, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count,
    // The rendered viewBox is the gutter-widened `totalWidth`, not `width`.
    width: geo?.totalWidth ?? width,
    height,
    locate,
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
        : geo === null
          ? strings.noData
          : dataDiffSummary(geo, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const ring = (i: number, pinned: boolean) => {
    const r = geo?.rows[i];
    if (!r) return null;
    return (
      <rect
        x={0.5}
        y={r.y - 1}
        width={geo!.totalWidth - 1}
        height={r.height + 2}
        fill="none"
        data-mc-active=""
        strokeWidth={0.8}
        data-mc-w={pinned ? "tick" : undefined}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const row = shown !== null && geo ? geo.rows[shown] : undefined;
  const announced = row
    ? strings.dataDiffAt(row.key, fmt(row.addedValue), fmt(row.removedValue), signed(row.net, fmt))
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-data-diff-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticDataDiff
        {...rest}
        style={fillFor(style)}
        data={data}
        labels={labels}
        label={label}
        order={order}
        domain={domain}
        maxItems={maxItems}
        format={format}
        locale={locale}
        width={width}
        height={height}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticDataDiff>
      {readout && row && geo ? (
        <span
          className="mc-data-diff-readout mc-spark-readout"
          style={rowReadoutStyle(geo.centerX, row.y + 4, geo.totalWidth, height)}
        >
          {`${row.key}: +${fmt(row.addedValue)} · −${fmt(row.removedValue)} (${signed(row.net, fmt)})`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
