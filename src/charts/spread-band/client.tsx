"use client";
// Interactive <SpreadBand>. Nearest-x lookup announces the lead at
// that point ("Point 6 of 12: organic +11 over paid."); the crosshair touches
// both lines. useActivePicker owns interaction: one pointer listener + nearest-x
// math, roving keyboard, touch tap-to-pin, and the onActive/onSelect contract.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, withPlus } from "../../core/format.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { isFiniteValue } from "../../core/types.js";
import { EN_SPREAD_BAND } from "../../core/strings-spread-band.js";
import { gutterFont, lastGap, spreadBandGeometry } from "./geometry.js";
import {
  DEFAULT_SERIES_LABELS,
  SpreadBand as StaticSpreadBand,
  seriesPair,
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
    seriesLabels = DEFAULT_SERIES_LABELS,
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
      const g = isFiniteValue(a) && isFiniteValue(b) ? a - b : null;
      // Mirror the readout chip exactly ("—", "level", or "organic +11").
      const [la, lb] = seriesPair(seriesLabels);
      return {
        index: i,
        value: g,
        formatted:
          g === null ? "—" : g === 0 ? "level" : `${g > 0 ? la : lb} ${withPlus(Math.abs(g), fmt)}`,
      };
    },
    [data, seriesLabels, fmt],
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
        : spreadBandSummary(geo, seriesLabels, fmt, strings);
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
  const [labelA, labelB] = seriesPair(seriesLabels);
  const leader = aLeads ? labelA : labelB;
  const other = aLeads ? labelB : labelA;

  const announced =
    shown === null
      ? ""
      : !bothFinite
        ? strings.spreadBandAtEmpty(shown + 1, n)
        : gap === 0
          ? strings.spreadBandAtTie(shown + 1, n)
          : strings.spreadBandAt(shown + 1, n, leader, withPlus(Math.abs(gap), fmt), other);

  const xAt = (i: number): number | undefined =>
    geo.subjectPoints[i]?.[0] ?? geo.referencePoints[i]?.[0];
  const crossX = shown !== null ? xAt(shown) : undefined;
  const pinX = selected !== null && selected !== active ? xAt(selected) : undefined;

  const chip = !bothFinite
    ? "—"
    : gap === 0
      ? "level"
      : `${leader} ${withPlus(Math.abs(gap), fmt)}`;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-spread-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticSpreadBand
        {...rest}
        data={data}
        seriesLabels={seriesLabels}
        label={label}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        // No `title` on the child: the wrapper owns the accessible name, and a
        // titled static is named (not hidden) even with `summary={false}`.
        summary={false}
        style={fillFor(style)}
      >
        {/* Response marks carry `data-mc-ui`, so they glide to the reading they
            name. The crosshairs travel on a transform because `x1`/`x2` have no
            CSS geometry property in any engine; the dots move on `cx`/`cy`,
            which do. */}
        {pinX !== undefined ? (
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={height}
            data-mc-ink="accent"
            data-mc-active=""
            data-mc-ui=""
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
            style={{ transform: `translateX(${pinX}px)` }}
          />
        ) : null}
        {crossX !== undefined ? (
          <>
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={height}
              data-mc-ink="muted"
              data-mc-ui=""
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
              style={{ transform: `translateX(${crossX}px)` }}
            />
            {geo.subjectPoints[shown!] ? (
              <circle
                cx={geo.subjectPoints[shown!]![0]}
                cy={geo.subjectPoints[shown!]![1]}
                r={2}
                data-mc-ink="accent"
                data-mc-ui=""
              />
            ) : null}
            {/* `neutral` rather than a bare inline neutral fill: an inline paint
                outranks the forced-colors mapping and this dot kept a warm gray
                in High Contrast Mode, where the crosshair beside it went
                system-ink. */}
            {geo.referencePoints[shown!] ? (
              <circle
                cx={geo.referencePoints[shown!]![0]}
                cy={geo.referencePoints[shown!]![1]}
                r={1.5}
                data-mc-ink="neutral"
                data-mc-ui=""
              />
            ) : null}
          </>
        ) : null}
        {rest.children}
      </StaticSpreadBand>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shown !== null && crossX !== undefined ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(crossX, width)}>
          {chip}
        </span>
      ) : null}
    </span>
  );
}
