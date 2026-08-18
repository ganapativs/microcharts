"use client";
// Interactive <MusicStaff>. Sparkline model: useActivePicker owns interaction
// one pointer listener + nearest-note lookup, ←/→ roving (rests are skipped).
// click / Enter / Space selects (onSelect). EN.point announcements.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import {
  CHIP,
  named,
  fillFor,
  navOrder,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { describeSeries, EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { lastFinite } from "../../core/stats.js";
import { isFiniteValue } from "../../core/types.js";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, musicStaffFrame, musicStaffGeometry } from "./geometry.js";
import { MusicStaff as StaticMusicStaff, type MusicStaffProps } from "./index.js";

export interface InteractiveMusicStaffProps extends MusicStaffProps, PickerProps {
  strings?: SeriesStrings;
  /**
   * Opt-in entrance motion (default `false`): the note heads pop onto the staff
   * one after another, left to right, and the melody line draws on behind them,
   * on first client-side mount. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

/** Focus (transient) / pin (persistent) ring around a note head. */
const ring = (nt: { cx: number; cy: number; rx: number }, pinned: boolean): React.ReactNode => (
  <circle
    cx={nt.cx}
    cy={nt.cy}
    r={nt.rx + 1.5}
    fill="none"
    data-mc-active=""
    data-mc-w={pinned ? "tick" : "support"}
  />
);

export function MusicStaff(props: InteractiveMusicStaffProps): React.ReactNode {
  const {
    data,
    mode = "ledger",
    label = "none",
    domain,
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
    format,
    locale,
    title,
    summary,
    strings = EN_SERIES,
    className,
    style,
    animate = false,
    readout = true,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // "trail" ordered by x — notes land left→right along the staff, echoing a
  // melody played in time order rather than a generic staggered settle. The
  // melodic contour connects those notes in time, so it must arrive AFTER them,
  // not fade in during the quiet stage before its own noteheads exist: `defer`
  // casts it into the closing act. (Its `data-mc-w="tick"` uniquely picks the
  // contour; the staff + ledger paths carry data-mc-ink="muted" instead.)
  useEntrance(hostRef, "trail", animate, { order: "x", link: 'path[data-mc-w="tick"]' });

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Box + label metrics come from the SAME resolver the static entry calls, so
  // the two cannot disagree about the note positions the rings sit on.
  const last = lastFinite(data);
  const labelText = label === "last" && isFiniteValue(last) ? fmt(last) : undefined;
  const { width, height, fontSize, gutter } = musicStaffFrame({
    width: widthProp,
    height: heightProp,
    fontSize: props.fontSize,
    labelSize: props.labelSize,
    labelText,
  });
  const geo = useMemo(
    () => musicStaffGeometry({ values: data, domain, width: width - gutter, height, mode, pad: 2 }),
    [data, domain, width, gutter, height, mode],
  );
  // Navigable units are the NOTES, but indices are reported in DATA space (rests
  // — non-finite values — are simply never landed on), matching Sparkline.
  const stops = useMemo(() => geo.notes.map((n) => n.index), [geo]);

  const locate = useCallback(
    (x: number) => {
      if (geo.notes.length === 0) return null;
      let best = geo.notes[0]!.index;
      let bestD = Infinity;
      for (const nt of geo.notes) {
        const d = Math.abs(nt.cx - x);
        if (d < bestD) {
          bestD = d;
          best = nt.index;
        }
      }
      return best;
    },
    [geo],
  );

  const step = useCallback((cur: number, key: string) => navOrder(stops, cur, key), [stops]);

  // `value` = the note's PITCH — the datum value the staff position encodes.
  const datum = useCallback(
    (i: number) => {
      const v = geo.notes.find((n) => n.index === i)?.value ?? null;
      return { index: i, value: v, formatted: v === null ? undefined : fmt(v) };
    },
    [geo, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: stops.length,
    width,
    height,
    locate,
    datum,
    step,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  // `strings` names the wrapper as well as the announcements: without it a host
  // that localized the roving readout still shipped an English accessible name.
  const accName =
    summary === false ? undefined : (summary ?? describeSeries(data, { format, locale, strings }));
  const shown = active ?? selected;
  const shownNote = shown !== null ? geo.notes.find((n) => n.index === shown) : undefined;
  const shownPos = shown !== null ? stops.indexOf(shown) + 1 : 0;
  const selNote = selected !== null ? geo.notes.find((n) => n.index === selected) : undefined;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-staff-live", className, style)}
      {...named([title, accName].filter(Boolean).join(". ") || undefined)}
      {...bind}
    >
      <StaticMusicStaff
        {...rest}
        data={data}
        mode={mode}
        label={label}
        domain={domain}
        width={width}
        height={height}
        fontSize={fontSize}
        format={format}
        locale={locale}
        summary={false}
        style={fillFor(style)}
      >
        {selNote && selected !== active ? ring(selNote, true) : null}
        {active !== null && shownNote ? ring(shownNote, false) : null}
        {rest.children}
      </StaticMusicStaff>
      <LiveRegion>
        {shownNote ? strings.point(shownPos, stops.length, fmt(shownNote.value)) : ""}
      </LiveRegion>
      {readout && shownNote ? (
        <span className="mc-spark-readout" {...CHIP}>
          {fmt(shownNote.value)}
        </span>
      ) : null}
    </span>
  );
}
