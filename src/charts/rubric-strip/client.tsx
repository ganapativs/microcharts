"use client";
// Interactive <RubricStrip>. One pointer listener; row by y lookup.
// ↑/↓ rove criteria. Composes the static component (canon).
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL, wrap } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_RUBRIC } from "../../core/strings-rubric.js";
import { rubricStripGeometry } from "./geometry.js";
import {
  RubricStrip as StaticRubricStrip,
  rubricStripSummary,
  type RubricStripProps,
} from "./index.js";

export interface InteractiveRubricStripProps extends RubricStripProps {
  /**
   * Opt-in entrance motion (default `false`): each criterion's bar sweeps in
   * from the left, staggered row by row, on first client-side mount. Inert on
   * the server and on hydrated server HTML; `prefers-reduced-motion` always
   * wins.
   */
  animate?: boolean;
}

export function RubricStrip(props: InteractiveRubricStripProps): React.ReactNode {
  const {
    data,
    labels = true,
    domain = [0, 1],
    width = 80,
    height: heightProp,
    format,
    locale,
    strings = EN_RUBRIC,
    title,
    summary,
    animate = false,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "sweep", animate, {
    selector:
      'rect[data-mc-ink="accent"], rect[data-mc-ink="positive"], rect[data-mc-ink="negative"]',
  });

  const n = Math.max(1, data.length);
  const height = heightProp ?? Math.min(32, Math.max(12, n * 8));
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const fontSize = Math.max(5, Math.min(7, Math.round((height / n) * 0.6)));
  const gutter = labels
    ? Math.min(width * 0.62, Math.max(...data.map((d) => d.label.length), 1) * fontSize * 0.64 + 4)
    : 0;
  const geo = useMemo(
    () =>
      rubricStripGeometry({
        data: data.map((d) => ({ label: d.label, score: d.score, weight: d.weight ?? 1 })),
        domain,
        width,
        height,
        gutter,
        gap: 1,
      }),
    [data, domain, width, height, gutter],
  );
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : rubricStripSummary(data, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.rows.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.height === 0) return;
      const y = ((e.clientY - r.top) / r.height) * height;
      const i = geo.rows.findIndex((row) => y >= row.y && y <= row.y + row.height);
      setActive(i >= 0 ? i : null);
    },
    [geo, height],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.rows.length === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowDown":
          next = Math.min(geo.rows.length - 1, cur + 1);
          break;
        case "ArrowUp":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.rows.length - 1;
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      setActive(next);
    },
    [active, geo],
  );

  const row = active != null ? geo.rows[active] : undefined;
  const announced = row
    ? strings.rubricRow(row.label, fmt(row.score), `${Math.round(row.weightShare * 100)}%`)
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-rubric-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticRubricStrip
        {...rest}
        data={data}
        labels={labels}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {row ? (
          <rect
            x={gutter - 0.5}
            y={row.y - 0.5}
            width={row.trackWidth + 1}
            height={row.height + 1}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticRubricStrip>
      <LiveRegion>{announced}</LiveRegion>
      {row ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {`${row.label} ${fmt(row.score)}`}
        </span>
      ) : null}
    </span>
  );
}
