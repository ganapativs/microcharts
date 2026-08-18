"use client";
// Interactive <VolumeProfile>. useActivePicker owns interaction: one pointer
// listener + the level band containing y, ↑/↓ rove bins (bottom-up index
// order). click / Enter / Space selects (onSelect).
import { useCallback, useMemo, useRef } from "react";
import { labelFont } from "../../core/labels.js";
import { makeFormatter, makePercentFormatter, makeUnitFormatter } from "../../core/format.js";
import {
  CHIP,
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_VOLUME_PROFILE } from "../../core/strings-volume-profile.js";
import { chartSide } from "../../core/types.js";
import {
  DEFAULT_BINS,
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  binMass,
  profileLayout,
  resolveValueArea,
} from "./geometry.js";
import {
  VolumeProfile as StaticVolumeProfile,
  volumeProfileSummary,
  type VolumeProfileProps,
} from "./index.js";

// Normal bars merge into one `path`; POC is a filled `rect` (accent on `path`
// is stroke-only in styles.css — same contract as Progress / SparkBar fills).
const PROFILE_SELECTOR = 'path[data-mc-ink="bar"], rect[data-mc-ink="accent"]';

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
    valueArea: valueAreaProp,
    align = "left",
    label: labelProp = "poc",
    bins = DEFAULT_BINS,
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
    format,
    locale,
    strings = EN_VOLUME_PROFILE,
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

  // Same resolution the static runs, on the same terms — the hit box, the focus
  // band and the readout's `top` are all sized off these, so a fallback the two
  // entries disagreed about would anchor the overlays to unpainted bars.
  const valueArea = resolveValueArea(valueAreaProp);
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "sweep", animate, {
    selector: PROFILE_SELECTOR,
    origin: align === "right" ? "right" : "left",
  });

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Shares went through `Math.round(x * 100) + "%"` — a hand-rolled percent that
  // ignores `locale` (fr-FR writes "18 %") and the mass behind it. Both fixed:
  // real formatter, and the magnitude travels with its share.
  const pctFmt = useMemo(() => makePercentFormatter(locale), [locale]);
  const massFmt = useMemo(
    () => makeUnitFormatter(undefined, locale, { notation: "compact" }),
    [locale],
  );
  // The POC label's gutter narrows every bar, so the client must reserve it on
  // the same terms the static does or its overlays anchor to unpainted bars.
  const fontSize = labelFont(height, 0.11, props.labelSize);
  const geo = useMemo(
    () =>
      profileLayout({
        data,
        bins,
        valueArea,
        align,
        width,
        height,
        label: labelProp,
        fontSize,
        fmt,
      }),
    [data, bins, valueArea, align, width, height, labelProp, fontSize, fmt],
  );
  const rows = useMemo(() => binMass(data, bins), [data, bins]);
  const total = useMemo(() => rows.reduce((s, r) => s + r.mass, 0), [rows]);

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
      return {
        index: i,
        value: rows[i]?.mass ?? null,
        label: b ? fmt(b.level) : undefined,
        formatted: b
          ? `${fmt(b.level)} · ${massFmt(rows[i]?.mass ?? 0)} (${pctFmt(total > 0 ? (rows[i]?.mass ?? 0) / total : 0)})${b.poc ? strings.volumePoc : ""}`
          : "",
      };
    },
    [rows, geo, fmt, massFmt, pctFmt, total, strings],
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
        : volumeProfileSummary(geo, valueArea, strings, fmt, pctFmt);
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
        data-mc-active=""
        strokeOpacity={0.6}
        data-mc-w={pinned ? "tick" : "support"}
      />
    );
  };

  const shown = active ?? selected;
  const bar = shown != null ? geo.bars[shown] : undefined;
  const share = bar && total > 0 ? (rows[shown!]?.mass ?? 0) / total : 0;
  const mass = massFmt(rows[shown ?? 0]?.mass ?? 0);
  const announced = bar
    ? strings.volumeAt(fmt(bar.level), pctFmt(share), bar.poc ? strings.volumePoc : "", mass)
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-volprofile-live", className, style)}
      {...named(label)}
      {...bind}
    >
      <StaticVolumeProfile
        {...rest}
        data={data}
        valueArea={valueArea}
        align={align}
        label={labelProp}
        bins={bins}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {selected !== null && selected !== active ? band(selected, true) : null}
        {active !== null ? band(active, false) : null}
        {rest.children}
      </StaticVolumeProfile>
      <LiveRegion>{announced}</LiveRegion>
      {readout && bar ? (
        /* Pinned to the bars' base edge: level labels + the poc flag sit at
           the bar TIPS, so the base side is the one spot the chip can never
           cover chart text. */
        <span className="mc-spark-readout" {...CHIP}>
          {`${fmt(bar.level)} · ${mass} (${pctFmt(share)})${bar.poc ? strings.volumePoc : ""}`}
        </span>
      ) : null}
    </span>
  );
}
