"use client";
// Interactive <Dumbbell>. useActivePicker owns interaction: one pointer listener
// + row-by-y-band lookup — ↑/↓ (or ←/→) rove rows, announcing each pair's change
// ("From 62,000 to 84,000, up 35%."); click / Enter / Space selects a row
// (onSelect). Composes the static component (canon) — the SVG never drifts.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_PAIRED, type PairedStrings } from "../../core/strings-paired.js";
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
   * Opt-in entrance motion (default `false`): the from/to endpoint dots settle
   * onto each row on first client-side mount (the connectors arrive with the
   * base fade). Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
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

  const fontSize = 6;
  // Label-gutter width, in chars — a full scan of the rows, so it is memoised:
  // the interactive entry re-renders on every unit crossed during a scrub.
  const maxLabelChars = useMemo(
    () =>
      data.some((d) => d.label)
        ? Math.min(
            6,
            data.reduce((m, d) => Math.max(m, d.label?.length ?? 0), 0),
          )
        : 0,
    [data],
  );
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
    [width, height, data, domain, maxLabelChars],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

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
      return { index: i, value: d && Number.isFinite(d.to) ? d.to : null, label: d?.label };
    },
    [data],
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
        : dumbbellSummary(data, fmt, strings);
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
  const shownChange = shownDatum ? pairChange(shownDatum.from, shownDatum.to) : null;
  const announced = (() => {
    if (!shownDatum) return "";
    const c = pairChange(shownDatum.from, shownDatum.to);
    return c
      ? strings.fromTo(fmt(shownDatum.from), fmt(shownDatum.to), c.dir, c.pct)
      : strings.flatPair(fmt(shownDatum.from));
  })();

  return (
    <span
      ref={hostRef}
      {...wrap("mc-dumbbell-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      {...bind}
    >
      <StaticDumbbell
        {...rest}
        style={FILL}
        data={data}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {/* Pinned selection persists through pointer-leave; focus ring is transient. */}
        {selected !== null && selected !== active ? marks(selected, true) : null}
        {active !== null ? marks(active, false) : null}
        {rest.children}
      </StaticDumbbell>
      <LiveRegion>{announced}</LiveRegion>
      {shownRow && shownDatum ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(((shownRow.x0 ?? 0) + (shownRow.x1 ?? shownRow.x0 ?? 0)) / 2 / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${fmt(shownDatum.from)} → ${fmt(shownDatum.to)}${shownChange ? ` (${shownChange.dir} ${shownChange.pct})` : ""}`}
        </span>
      ) : null}
    </span>
  );
}
