"use client";
// Interactive <CoverageStrip>. useActivePicker owns interaction: one pointer
// listener on the wrapper + pure grid lookup (x → slot by division) — never a
// node per cell. ←/→ steps slots, Home/End jump, click / Enter / Space selects
// (onSelect). The live region says exactly what each slot is: a measured value,
// or "no measurement" (the honest distinction). Composes the static component
// (canon); the focus ring is an overlay child re-using the same geometry.
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
import { EN_COVERAGE, type CoverageStrings } from "../../core/strings-coverage.js";
import { labelFitsBand } from "../../core/labels.js";
import { coverageGeometry } from "./geometry.js";
import { CoverageStrip as StaticCoverageStrip, type CoverageStripProps } from "./index.js";

export interface InteractiveCoverageStripProps extends CoverageStripProps, PickerProps {
  strings?: CoverageStrings;
  /**
   * Opt-in entrance motion (default `false`): the strip wipes in left to right
   * on first client-side mount — a time-forward reveal for the 1×N slots (an
   * index cascade over so many cells collapses under the stagger cap into a
   * near-simultaneous fade). Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function CoverageStrip(props: InteractiveCoverageStripProps): React.ReactNode {
  const {
    data,
    expected,
    mode = "binary",
    steps = 5,
    domain,
    shape = "square",
    label = "none",
    width = 80,
    height = 10,
    format,
    locale,
    strings = EN_COVERAGE,
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
  // Time runs along x: each slot lights up in turn, oldest→newest. An explicit
  // `order:"x"` + `window` spreads the cascade across the whole strip (it does
  // NOT collapse under the default stagger cap), so the reveal reads as time
  // advancing cell by cell; past `maxMarks` a dense strip still falls to wipe.
  useEntrance(hostRef, "reveal", animate, {
    selector: 'rect[data-mc-ink="cell"], rect[data-mc-ink="gap"]',
    order: "x",
    window: 400,
  });

  // must match the static entry's font formula — the label gutter widens
  // totalWidth, and a mismatched fontSize would drift the readout off-cell
  const font = Math.min(11, Math.max(7, Math.round(height * 0.62)));
  // …and its drop rule: the static drops the percent (and its gutter) once the
  // box is shorter than one em, so reserving it here would widen totalWidth past
  // the composed static's and hang the readout off the end of the strip.
  const showLabel = label === "percent" && labelFitsBand(height, font);
  const geo = useMemo(
    () =>
      coverageGeometry({
        width,
        height,
        data,
        expected,
        mode,
        steps,
        domain,
        shape,
        gutterCh: showLabel ? 4 : 0,
        fontSize: font,
      }),
    [width, height, data, expected, mode, steps, domain, shape, showLabel, font],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const pctFmt = useMemo(
    () => makeFormatter({ style: "percent", maximumFractionDigits: 0 }, locale),
    [locale],
  );

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo.expected === 0
          ? strings.noData
          : strings.coverage(geo.measured, geo.expected, pctFmt(geo.coverage), geo.longestGap);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // Pointer (viewBox space) → slot index by pitch division, clamped to the strip.
  const locate = useCallback(
    (x: number) => {
      if (geo.pitch === 0 || geo.cells.length === 0) return null;
      return Math.min(geo.cells.length - 1, Math.max(0, Math.floor(x / geo.pitch)));
    },
    [geo],
  );

  // index = slot (time-ordered); value = the measured number, or `null` for a
  // gap (no measurement) or an unreadable NaN. Slots have no human name.
  const datum = useCallback(
    (i: number) => ({ index: i, value: geo.cells[i]?.value ?? null }),
    [geo],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.cells.length,
    width: geo.totalWidth,
    height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const ring = (i: number, pinned: boolean) => {
    const c = geo.cells[i];
    if (!c) return null;
    return (
      <rect
        x={c.x - 0.75}
        y={c.y - 0.75}
        width={c.w + 1.5}
        height={c.h + 1.5}
        rx={c.rx + 0.75}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const cell = shown !== null ? geo.cells[shown] : undefined;
  let announced = "";
  if (cell) {
    announced = !cell.present
      ? strings.coverageSlot(shown! + 1, null)
      : strings.coverageSlot(shown! + 1, cell.value === null ? "—" : fmt(cell.value));
  }

  return (
    <span
      ref={hostRef}
      {...wrap("mc-coverage-strip-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticCoverageStrip
        {...rest}
        style={fillFor(style)}
        data={data}
        expected={expected}
        mode={mode}
        steps={steps}
        domain={domain}
        shape={shape}
        label={label}
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
      </StaticCoverageStrip>
      {cell ? (
        <span
          className="mc-coverage-readout mc-spark-readout"
          style={{
            left: `${((cell.x + cell.w / 2) / geo.totalWidth) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {/* no hardcoded English in the chip (i18n canon): non-values show a
              dash; the live region carries the localized full sentence */}
          {cell.present && cell.value !== null ? fmt(cell.value) : "—"}
        </span>
      ) : null}
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
    </span>
  );
}
