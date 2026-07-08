"use client";
// Interactive <Dumbbell> (plan/22 #11). One pointer listener; row by y-band.
// ↑/↓ rove rows; ←/→ within a row toggles the from/to announcement
// ("From: 62,000." / "To: 84,000."). Composes the static component (canon).
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_PAIRED, type PairedStrings } from "../../core/strings-paired.js";
import { dumbbellGeometry } from "./geometry.js";
import {
  Dumbbell as StaticDumbbell,
  dumbbellSummary,
  pairChange,
  type DumbbellProps,
} from "./index.js";

export interface InteractiveDumbbellProps extends DumbbellProps {
  strings?: PairedStrings;
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
    ...rest
  } = props;
  const height = props.height ?? data.length * 12;

  const fontSize = 6;
  const hasLabels = data.some((d) => d.label);
  const maxLabelChars = hasLabels
    ? Math.min(
        6,
        data.reduce((m, d) => Math.max(m, d.label?.length ?? 0), 0),
      )
    : 0;
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
  const [active, setActive] = useState<number | null>(null);
  /** null = whole pair; "from" | "to" = one end focused via ←/→. */
  const [end, setEnd] = useState<"from" | "to" | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : dumbbellSummary(data, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.rows.length === 0 || geo.pitch === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.height === 0) return;
      const y = ((e.clientY - r.top) / r.height) * height;
      const i = Math.floor(y / geo.pitch);
      setActive(i >= 0 && i < geo.rows.length ? i : null);
      setEnd(null);
    },
    [geo, height],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.rows.length === 0) return;
      const cur = active ?? 0;
      switch (e.key) {
        case "ArrowDown":
          setActive(Math.min(geo.rows.length - 1, cur + 1));
          setEnd(null);
          break;
        case "ArrowUp":
          setActive(Math.max(0, cur - 1));
          setEnd(null);
          break;
        case "ArrowRight":
          setActive(cur);
          setEnd("to");
          break;
        case "ArrowLeft":
          setActive(cur);
          setEnd("from");
          break;
        case "Escape":
          setActive(null);
          setEnd(null);
          return;
        default:
          return;
      }
      e.preventDefault();
    },
    [active, geo],
  );

  const activeRow = active !== null ? geo.rows[active] : undefined;
  const activeDatum = active !== null ? data[active] : undefined;
  const announced = (() => {
    if (!activeDatum) return "";
    if (end === "from") return `From: ${fmt(activeDatum.from)}.`;
    if (end === "to") return `To: ${fmt(activeDatum.to)}.`;
    const c = pairChange(activeDatum.from, activeDatum.to);
    return c
      ? strings.fromTo(fmt(activeDatum.from), fmt(activeDatum.to), c.dir, c.pct)
      : strings.flatPair(fmt(activeDatum.from));
  })();

  return (
    <span
      className="mc-dumbbell-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticDumbbell
        {...rest}
        data={data}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {activeRow ? (
          <>
            {(end === null || end === "from") && activeRow.x0 !== null ? (
              <circle
                cx={activeRow.x0}
                cy={activeRow.y}
                r={3.25}
                fill="none"
                stroke="var(--mc-accent)"
                strokeWidth={1.25}
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            {(end === null || end === "to") && activeRow.x1 !== null ? (
              <circle
                cx={activeRow.x1}
                cy={activeRow.y}
                r={3.25}
                fill="none"
                stroke="var(--mc-accent)"
                strokeWidth={1.25}
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </>
        ) : null}
        {rest.children}
      </StaticDumbbell>
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
      {activeRow && activeDatum ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(((activeRow.x0 ?? 0) + (activeRow.x1 ?? activeRow.x0 ?? 0)) / 2 / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {end === "from"
            ? fmt(activeDatum.from)
            : end === "to"
              ? fmt(activeDatum.to)
              : `${fmt(activeDatum.from)} → ${fmt(activeDatum.to)}`}
        </span>
      ) : null}
    </span>
  );
}
