"use client";
// Interactive <SpreadBand>. Nearest-x lookup announces the lead at
// that point ("Point 6 of 12: organic +11 over paid."); the crosshair touches
// both lines. useActivePicker owns interaction: one pointer listener + nearest-x
// math, roving keyboard, touch tap-to-pin, and the onActive/onSelect contract.
// Composes the static component (canon) — the SVG is never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { isFiniteValue } from "../../core/types.js";
import { EN_SPREAD_BAND } from "../../core/strings-spread-band.js";
import { gutterFont, lastGap, spreadBandGeometry } from "./geometry.js";
import {
  SpreadBand as StaticSpreadBand,
  signedGap,
  spreadBandSummary,
  type SpreadBandProps,
} from "./index.js";

export interface InteractiveSpreadBandProps extends SpreadBandProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): the signed gap band wipes on
   * when the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function SpreadBand(props: InteractiveSpreadBandProps): React.ReactNode {
  const {
    data,
    labels = ["A", "B"],
    label = "gap",
    domain,
    width = 80,
    height = 20,
    format,
    locale,
    strings = EN_SPREAD_BAND,
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
  useEntrance(hostRef, "wipe", animate);

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const fontSize = gutterFont(height);

  const endGap = lastGap(data);
  const showLabel = label === "gap" && endGap !== null && endGap !== 0;
  const gutterCh = showLabel ? signedGap(endGap!, fmt).length : 0;

  const geo = useMemo(
    () => spreadBandGeometry({ width, height, data, domain, gutterCh, fontSize }),
    [width, height, data, domain, gutterCh, fontSize],
  );
  const n = data.length;

  // Navigable units are the paired readings — 1:1 with `data`, so the reported
  // index IS the data index (a null pair is still a stop; it announces "empty").
  const locate = useCallback(
    (x: number) => {
      if (n === 0) return null;
      const span = geo.plot.x1 - geo.plot.x0;
      const i = Math.round(((x - geo.plot.x0) / Math.max(1, span)) * (n - 1));
      return Math.min(n - 1, Math.max(0, i));
    },
    [n, geo],
  );

  // `value` = the SIGNED GAP a − b at that reading: the band is this chart's
  // primary encoding (the two lines are its edges, announced in the live region
  // and the readout chip). `null` when either half of the pair is missing.
  const datum = useCallback(
    (i: number) => {
      const d = data[i];
      const a = d?.a;
      const b = d?.b;
      return {
        index: i,
        value: isFiniteValue(a) && isFiniteValue(b) ? a - b : null,
      };
    },
    [data],
  );

  const { active, selected, bind } = useActivePicker({
    count: n,
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
        : spreadBandSummary(geo, labels, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // The reading shown by the crosshair + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const d = shown !== null ? data[shown] : undefined;
  const av = d?.a;
  const bv = d?.b;
  const bothFinite = isFiniteValue(av) && isFiniteValue(bv);
  const gap = bothFinite ? (av as number) - (bv as number) : 0;
  const aLeads = gap > 0;
  const leader = aLeads ? labels[0] : labels[1];
  const other = aLeads ? labels[1] : labels[0];

  const announced =
    shown === null
      ? ""
      : !bothFinite
        ? strings.spreadBandAtEmpty(shown + 1, n)
        : gap === 0
          ? strings.spreadBandAtTie(shown + 1, n)
          : strings.spreadBandAt(shown + 1, n, leader, `+${fmt(Math.abs(gap))}`, other);

  const xAt = (i: number): number | undefined =>
    geo.subjectPoints[i]?.[0] ?? geo.referencePoints[i]?.[0];
  const crossX = shown !== null ? xAt(shown) : undefined;
  const pinX = selected !== null && selected !== active ? xAt(selected) : undefined;

  const chip = !bothFinite ? "—" : gap === 0 ? "level" : `${leader} +${fmt(Math.abs(gap))}`;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-spread-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      {...bind}
    >
      <StaticSpreadBand
        {...rest}
        data={data}
        labels={labels}
        label={label}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        title={title}
        summary={false}
        style={FILL}
      >
        {/* Pinned selection persists through pointer-leave; the crosshair is transient. */}
        {pinX !== undefined ? (
          <line
            x1={pinX}
            y1={0}
            x2={pinX}
            y2={height}
            data-mc-ink="accent"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {crossX !== undefined ? (
          <>
            <line
              x1={crossX}
              y1={0}
              x2={crossX}
              y2={height}
              data-mc-ink="muted"
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
            {geo.subjectPoints[shown!] ? (
              <circle
                cx={geo.subjectPoints[shown!]![0]}
                cy={geo.subjectPoints[shown!]![1]}
                r={2}
                data-mc-ink="accent"
              />
            ) : null}
            {geo.referencePoints[shown!] ? (
              <circle
                cx={geo.referencePoints[shown!]![0]}
                cy={geo.referencePoints[shown!]![1]}
                r={1.5}
                style={{ fill: "var(--mc-neutral)" }}
              />
            ) : null}
          </>
        ) : null}
        {rest.children}
      </StaticSpreadBand>
      <LiveRegion>{announced}</LiveRegion>
      {shown !== null && crossX !== undefined ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${(crossX / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {chip}
        </span>
      ) : null}
    </span>
  );
}
