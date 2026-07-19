"use client";
// Interactive <VolumeProfile>. useActivePicker owns interaction: one pointer
// listener + the level band containing y, ↑/↓ rove bins (bottom-up index
// order), click / Enter / Space selects (onSelect). Composes the static
// component (canon) — the SVG is never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_VOLUME_PROFILE } from "../../core/strings-volume-profile.js";
import { binMass, volumeProfileGeometry } from "./geometry.js";
import {
  VolumeProfile as StaticVolumeProfile,
  volumeProfileSummary,
  type VolumeProfileProps,
} from "./index.js";

// Bars are single merged `path`s (one per role), not `rect`s — the default
// `sweep` selector only matches rects.
const PROFILE_SELECTOR = 'path[data-mc-ink="bar"], path[data-mc-ink="accent"]';

export interface InteractiveVolumeProfileProps extends VolumeProfileProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): level bars sweep in from the
   * `align` edge when the chart first mounts client-side. Inert on the
   * server and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function VolumeProfile(props: InteractiveVolumeProfileProps): React.ReactNode {
  const {
    data,
    valueArea = 0.7,
    align = "left",
    bins = 12,
    width = 48,
    height = 32,
    format,
    locale,
    strings = EN_VOLUME_PROFILE,
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

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "sweep", animate, {
    selector: PROFILE_SELECTOR,
    origin: align === "right" ? "right" : "left",
  });

  const geo = useMemo(
    () => volumeProfileGeometry({ data, bins, valueArea, align, width, height, gutter: 0 }),
    [data, bins, valueArea, align, width, height],
  );
  const rows = useMemo(() => binMass(data, bins), [data, bins]);
  const total = useMemo(() => rows.reduce((s, r) => s + r.mass, 0), [rows]);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // Pointer (viewBox space) → the level band containing y.
  const locate = useCallback(
    (_x: number, y: number) => {
      const i = geo.bars.findIndex((b) => y >= b.y && y <= b.y + b.height);
      return i >= 0 ? i : null;
    },
    [geo],
  );
  // index = LEVEL BIN index (ascending level, bin 0 drawn at the bottom) — the
  // raw `data` rows are binned, so this is a unit position, not a data index.
  const datum = useCallback(
    (i: number) => {
      const b = geo.bars[i];
      return { index: i, value: rows[i]?.mass ?? null, label: b ? fmt(b.level) : undefined };
    },
    [rows, geo, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.bars.length,
    width,
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
        : volumeProfileSummary(geo, valueArea, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const band = (i: number, pinned: boolean) => {
    const b = geo.bars[i];
    if (!b) return null;
    return (
      <rect
        x={0.5}
        y={b.y - 0.4}
        width={width - 1}
        height={b.height + 0.8}
        fill="none"
        stroke="var(--mc-accent)"
        strokeOpacity={0.6}
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const bar = shown != null ? geo.bars[shown] : undefined;
  const share = bar && total > 0 ? (rows[shown!]?.mass ?? 0) / total : 0;
  const announced = bar
    ? strings.volumeAt(
        fmt(bar.level),
        `${Math.round(share * 100)}%`,
        bar.poc ? strings.volumePoc : "",
      )
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-volprofile-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      {...bind}
    >
      <StaticVolumeProfile
        {...rest}
        data={data}
        valueArea={valueArea}
        align={align}
        bins={bins}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {/* Pinned selection persists through pointer-leave; focus band is transient. */}
        {selected !== null && selected !== active ? band(selected, true) : null}
        {active !== null ? band(active, false) : null}
        {rest.children}
      </StaticVolumeProfile>
      <LiveRegion>{announced}</LiveRegion>
      {bar ? (
        /* Pinned to the bars' base edge: level labels + the poc flag sit at
           the bar TIPS, so the base side is the one spot the chip can never
           cover chart text. */
        <span
          className="mc-spark-readout"
          style={{
            top: `${((bar.y + bar.height / 2) / height) * 100}%`,
            ...(align === "right" ? { left: "auto", right: 4 } : { left: 4 }),
            transform: "translateY(-50%)",
            bottom: "auto",
          }}
        >
          {`${fmt(bar.level)} · ${Math.round(share * 100)}%${bar.poc ? strings.volumePoc : ""}`}
        </span>
      ) : null}
    </span>
  );
}
