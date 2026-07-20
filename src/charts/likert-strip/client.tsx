"use client";
// Interactive <LikertStrip>. useActivePicker owns interaction: one pointer
// listener + segment-by-x-band lookup, ←/→ step levels in DATA order
// ("Agree: 34%, level 4 of 5."), click / Enter / Space selects (onSelect).
// Composes the static component (canon) — the SVG is never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { useSeatHoist } from "../../shared/seat-hoist.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { LIKERT_FONT, likertGutter, likertStripGeometry } from "./geometry.js";
import { LikertStrip as StaticLikertStrip, likertSummary, type LikertStripProps } from "./index.js";

export interface InteractiveLikertStripProps extends LikertStripProps, PickerProps {
  strings?: CompositionStrings;
  /**
   * Opt-in entrance motion (default `false`): segments sweep outward from the
   * center line on first client-side mount — negative ink grows left, positive
   * right. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function LikertStrip(props: InteractiveLikertStripProps): React.ReactNode {
  const {
    data,
    neutral = "split",
    label = "ends",
    width = 60,
    height = 12,
    format,
    locale,
    strings = EN_COMPOSITION,
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
  // no LiveRegion here to host it: seat the wrapper so the readout chip
  // and the hit box travel with the mark when inline (see seat-hoist).
  useSeatHoist(hostRef);
  // "sweep" with per-mark signed origin — the diverging composition grows OUT
  // from the center line: negative ink grows leftward (origin right), positive
  // rightward (origin left), echoing the encoding instead of a flat fade.
  useEntrance(hostRef, "sweep", animate, {
    origin: "signed",
    selector:
      'rect[data-mc-ink="negative"], rect[data-mc-ink="positive"], rect[data-mc-ink="neutral"]',
  });

  const fontSize = LIKERT_FONT;
  const gutter = likertGutter(label !== "none", fontSize);
  const geo = useMemo(
    () =>
      likertStripGeometry({
        width,
        height,
        values: data.map((d) => d.value),
        neutral,
        gutterL: gutter,
        gutterR: gutter,
      }),
    [width, height, data, neutral, gutter],
  );
  const pctFmt = useMemo(
    () => makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 }),
    [format, locale],
  );

  const locate = useCallback(
    (x: number) => {
      if (!geo || geo.segments.length === 0) return null;
      const i = geo.segments.findIndex((s) => x >= s.x && x <= s.x + s.width);
      return i >= 0 ? i : null;
    },
    [geo],
  );
  // Unit = rendered segment position (left→right = data order). With
  // `neutral="omit"` the neutral level has no segment, so the unit index is the
  // SEGMENT position, not the response level — `seg.level` carries the level.
  const datum = useCallback(
    (i: number) => {
      const s = geo?.segments[i];
      const d = s ? data[s.level] : undefined;
      return { index: i, value: d && Number.isFinite(d.value) ? d.value : null, label: d?.label };
    },
    [data, geo],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo?.segments.length ?? 0,
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
        : geo
          ? likertSummary(geo.shares, data.length % 2 === 1, pctFmt, strings)
          : strings.noResponses;
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const outline = (i: number, pinned: boolean) => {
    const s = geo?.segments[i];
    if (!s) return null;
    return (
      <rect
        x={s.x - 0.5}
        y={1}
        width={s.width + 1}
        height={height - 2}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const seg = geo && shown !== null ? geo.segments[shown] : undefined;
  const segDatum = seg ? data[seg.level] : undefined;
  const announced =
    seg && segDatum
      ? strings.likertAt(segDatum.label, pctFmt(seg.share), seg.level + 1, data.length)
      : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-likert-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticLikertStrip
        {...rest}
        style={fillFor(style)}
        data={data}
        neutral={neutral}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {/* Pinned selection persists through pointer-leave; focus outline is transient. */}
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
        {rest.children}
      </StaticLikertStrip>
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
      {seg && segDatum ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((seg.x + seg.width / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${segDatum.label} ${pctFmt(seg.share)}`}
        </span>
      ) : null}
    </span>
  );
}
