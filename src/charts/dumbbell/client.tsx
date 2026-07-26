"use client";
// Interactive <Dumbbell>. useActivePicker owns interaction: one pointer listener
// + row-by-y-band lookup — ↑/↓ (or ←/→) rove rows, announcing each pair's change
// ("From 62,000 to 84,000, up 35%."); click / Enter / Space selects a row
// (onSelect). Composes the static component (canon) — the SVG never drifts.
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
import { EN_PAIRED, type PairedStrings } from "../../core/strings-paired.js";
import { labelFont, proseCharsThatFit } from "../../core/labels.js";
import { dumbbellGeometry } from "./geometry.js";
import {
  Dumbbell as StaticDumbbell,
  dumbbellSummary,
  pairChange,
  type DumbbellProps,
} from "./index.js";

export interface InteractiveDumbbellProps extends DumbbellProps, PickerProps {
  strings?: PairedStrings;
  /**
   * Opt-in entrance motion (default `false`): the from/to endpoint dots TRAIL
   * in on first client-side mount — they pop one row after the next, top to
   * bottom, and each connector draws in as its pair lands. Inert on the server
   * and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

// The chip and `datum.formatted` show the direction on its OWN, with no sentence
// around it, so neither can use the `fromTo`/`rows` templates (those take the
// direction as an enum and word it themselves). Both were rendering the raw
// `"up"`/`"down"` token — English no bundle could reach. Module scope, so it adds
// no identity to any hook's dependency list.
function dirWord(strings: PairedStrings, dir: "up" | "down"): string {
  return strings.dirNames[dir === "up" ? 0 : 1];
}

export function Dumbbell(props: InteractiveDumbbellProps): React.ReactNode {
  const {
    data,
    domain,
    width = 60,
    format,
    locale,
    strings = EN_PAIRED,
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
  const height = props.height ?? data.length * 12;

  const hostRef = useRef<HTMLSpanElement>(null);
  // "trail" ordered by y — rows populate top→down, one at a time. Covers both
  // endpoints regardless of shape: the "from" hollow ring has no data-mc-ink
  // attribute, only the "to" dot does — a bare `circle` selector catches both.
  // The connector is valence-encoded DATA (its color reads the change
  // direction), so it must arrive WITH the endpoints, not materialize before
  // them: `defer` casts it into the closing act so it draws in as the dots land.
  useEntrance(hostRef, "trail", animate, {
    selector: "circle",
    order: "y",
    link: "line[data-mc-ink]",
  });

  const fontSize = labelFont(height, 0.42);
  // Label-gutter width, in chars — a full scan of the rows, so it is memoised:
  // the interactive entry re-renders on every unit crossed during a scrub.
  const maxLabelChars = useMemo(() => {
    if (!data.some((d) => d.label)) return 0;
    const longest = data.reduce((m, d) => Math.max(m, d.label?.length ?? 0), 0);
    return Math.min(longest, Math.max(4, proseCharsThatFit(width * 0.42, fontSize, 4)));
  }, [data, width, fontSize]);
  const geo = useMemo(
    () =>
      dumbbellGeometry({
        width,
        height,
        pairs: data.map((d) => ({ from: d.from, to: d.to })),
        domain,
        gutterCh: maxLabelChars > 0 ? maxLabelChars + 1 : 0,
        fontSize,
      }),
    [width, height, data, domain, maxLabelChars, fontSize],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Relative change — takes `locale`, never the value `format` (its units).
  const pctFmt = useMemo(() => makePercentFormatter(locale), [locale]);

  // Pointer (viewBox space) → row index by pure y-band math (rows are the axis).
  const locate = useCallback(
    (_x: number, y: number) => {
      if (geo.rows.length === 0 || geo.pitch === 0) return null;
      const i = Math.floor(y / geo.pitch);
      return i >= 0 && i < geo.rows.length ? i : null;
    },
    [geo],
  );

  // 1-D roving over rows. Layout is vertical, so ↑/↓ walk rows; ←/→ map to the
  // same prev/next for pointer-free reach. Boundary keys are consumed.
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

  // index = ROW (category) index; value = the row's `to` (the "after" endpoint,
  // the pair's primary read), null when the endpoint is missing; label = category.
  const datum = useCallback(
    (i: number) => {
      const d = data[i];
      const c = d ? pairChange(d.from, d.to, pctFmt) : null;
      return {
        index: i,
        value: d && Number.isFinite(d.to) ? d.to : null,
        label: d?.label,
        formatted: d
          ? `${Number.isFinite(d.from) ? fmt(d.from) : "—"} → ${Number.isFinite(d.to) ? fmt(d.to) : "—"}${c ? ` (${dirWord(strings, c.dir)} ${c.pct})` : ""}`
          : undefined,
      };
    },
    [data, fmt, pctFmt, strings],
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
        : dumbbellSummary(data, fmt, strings, pctFmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // Accent rings hugging the whole row (both endpoints). Transient for
  // hover/focus; a distinguishing `data-mc-w="tick"` marks the persistent pin.
  const marks = (i: number, pinned: boolean) => {
    const row = geo.rows[i];
    if (!row) return null;
    const wRole = pinned ? "tick" : "support";
    return (
      <>
        {row.x0 !== null ? (
          <circle
            cx={row.x0}
            cy={row.y}
            r={3.25}
            fill="none"
            stroke="var(--mc-accent)"
            strokeWidth={1.25}
            data-mc-w={wRole}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {row.x1 !== null ? (
          <circle
            cx={row.x1}
            cy={row.y}
            r={3.25}
            fill="none"
            stroke="var(--mc-accent)"
            strokeWidth={1.25}
            data-mc-w={wRole}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </>
    );
  };

  const shown = active ?? selected;
  const shownRow = shown !== null ? geo.rows[shown] : undefined;
  const shownDatum = shown !== null ? data[shown] : undefined;
  const shownChange = shownDatum ? pairChange(shownDatum.from, shownDatum.to, pctFmt) : null;
  // A pair may arrive with a null/NaN/±Infinity endpoint; never format one. Like the
  // static summary (which speaks only finite-both pairs), an incomplete pair reads as
  // "No data." rather than leaking a half-formatted endpoint. Dumbbell's voice is
  // label-free, so `label` (optional here) stays out of the announcement.
  const okFrom = shownDatum ? Number.isFinite(shownDatum.from) : false;
  const okTo = shownDatum ? Number.isFinite(shownDatum.to) : false;
  const announced = (() => {
    if (!shownDatum) return "";
    if (!okFrom || !okTo) return strings.noData;
    const c = pairChange(shownDatum.from, shownDatum.to, pctFmt);
    return c
      ? strings.fromTo(fmt(shownDatum.from), fmt(shownDatum.to), c.dir, c.pct)
      : strings.flatPair(fmt(shownDatum.from));
  })();

  return (
    <span ref={hostRef} {...wrap("mc-dumbbell-live", className, style)} {...named(label)} {...bind}>
      <StaticDumbbell
        {...rest}
        style={fillFor(style)}
        data={data}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? marks(selected, true) : null}
        {active !== null ? marks(active, false) : null}
        {rest.children}
      </StaticDumbbell>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownRow && shownDatum ? (
        <span
          className="mc-spark-readout"
          style={rowReadoutStyle(
            ((shownRow.x0 ?? 0) + (shownRow.x1 ?? shownRow.x0 ?? 0)) / 2,
            shownRow.y,
            width,
            height,
          )}
        >
          {`${okFrom ? fmt(shownDatum.from) : "—"} → ${okTo ? fmt(shownDatum.to) : "—"}${shownChange ? ` (${dirWord(strings, shownChange.dir)} ${shownChange.pct})` : ""}`}
        </span>
      ) : null}
    </span>
  );
}
