"use client";
// Interactive <MusicStaff> (plan/24 #12). Sparkline model: one pointer listener
// + nearest-note lookup, ←/→ roving, a ring on the focused note, EN.point
// announcements. Composes the static component (ring as its child).
import { useMemo, useState, type CSSProperties, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { describeSeries, EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { lastFinite } from "../../core/stats.js";
import { isFiniteValue } from "../../core/types.js";
import { musicStaffGeometry } from "./geometry.js";
import { MusicStaff as StaticMusicStaff, type MusicStaffProps } from "./index.js";

const FILL: CSSProperties = { display: "block", width: "100%", height: "auto" };

export interface InteractiveMusicStaffProps extends MusicStaffProps {
  strings?: SeriesStrings;
}

export function MusicStaff(props: InteractiveMusicStaffProps): React.ReactNode {
  const {
    data,
    range = "ledger",
    label = "none",
    domain,
    width = 60,
    height = 28,
    fontSize = 7,
    format,
    locale,
    title,
    summary,
    strings = EN_SERIES,
    className,
    style,
    ...rest
  } = props;

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const last = lastFinite(data);
  const gutter =
    label === "last" && isFiniteValue(last)
      ? Math.ceil(`${fmt(last as number)}`.length * 0.62 * fontSize + 2)
      : 0;
  const geo = useMemo(
    () =>
      musicStaffGeometry({ values: data, domain, width: width - gutter, height, range, pad: 2 }),
    [data, domain, width, gutter, height, range],
  );
  const stops = geo.notes.map((n) => n.index);
  const [active, setActive] = useState<number | null>(null);

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (geo.notes.length === 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width === 0) return;
    const x = ((e.clientX - r.left) / r.width) * width;
    let best = geo.notes[0]!.index;
    let bestD = Infinity;
    for (const nt of geo.notes) {
      const d = Math.abs(nt.cx - x);
      if (d < bestD) {
        bestD = d;
        best = nt.index;
      }
    }
    setActive(best);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (stops.length === 0) return;
    const pos = active === null ? -1 : stops.indexOf(active);
    let target = pos;
    switch (e.key) {
      case "ArrowRight":
        target = Math.min(stops.length - 1, pos + 1);
        break;
      case "ArrowLeft":
        target = pos <= 0 ? 0 : pos - 1;
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = stops.length - 1;
        break;
      case "Escape":
        setActive(null);
        return;
      default:
        return;
    }
    e.preventDefault();
    setActive(stops[target]!);
  };

  const accName =
    summary === false ? undefined : (summary ?? describeSeries(data, { format, locale }));
  const activeNote = active !== null ? geo.notes.find((n) => n.index === active) : undefined;
  const activePos = active !== null ? stops.indexOf(active) + 1 : 0;

  return (
    <span
      className={className ? `mc-staff-live ${className}` : "mc-staff-live"}
      style={{ display: "inline-block", position: "relative", lineHeight: 0, ...style }}
      tabIndex={0}
      role="img"
      aria-label={[title, accName].filter(Boolean).join(". ") || undefined}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onBlur={() => setActive(null)}
    >
      <StaticMusicStaff
        {...rest}
        data={data}
        range={range}
        label={label}
        domain={domain}
        width={width}
        height={height}
        fontSize={fontSize}
        format={format}
        locale={locale}
        summary={false}
        style={FILL}
      >
        {activeNote ? (
          <circle
            cx={activeNote.cx}
            cy={activeNote.cy}
            r={activeNote.rx + 1.5}
            fill="none"
            stroke="var(--mc-accent)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticMusicStaff>
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
        {activeNote ? strings.point(activePos, stops.length, fmt(activeNote.value)) : ""}
      </span>
      {activeNote ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${(activeNote.cx / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {fmt(activeNote.value)}
        </span>
      ) : null}
    </span>
  );
}
