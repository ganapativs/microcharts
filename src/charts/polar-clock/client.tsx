"use client";
// Interactive <PolarClock> (plan/24 #17). One pointer listener; the cursor angle
// (atan2, 12 o'clock clockwise) maps to a segment. Hover lifts that sector to the
// accent and shows its label; ←/→ step segments circularly; a polite live region
// announces the focused segment. Composes the static component (canon).
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { annulusSector } from "../../core/arc.js";
import { EN_POLAR_CLOCK, type PolarClockStrings } from "../../core/strings-polar-clock.js";
import { polarClockGeometry } from "./geometry.js";
import {
  PolarClock as StaticPolarClock,
  polarClockSummary,
  type PolarClockProps,
} from "./index.js";

const TAU = Math.PI * 2;

export interface InteractivePolarClockProps extends PolarClockProps {
  strings?: PolarClockStrings;
}

function defaultSegmentLabel(strings: PolarClockStrings, index: number, n: number): string {
  if (n === 24) return `${String(index).padStart(2, "0")}:00`;
  if (n === 7) return strings.weekdays[((index % 7) + 7) % 7] ?? String(index);
  return String(index);
}

export function PolarClock(props: InteractivePolarClockProps): React.ReactNode {
  const {
    data,
    now,
    inner = 0.35,
    start = 0,
    mode = "length",
    formatSegment,
    size = 24,
    format,
    locale,
    strings = EN_POLAR_CLOCK,
    title,
    summary,
    ...rest
  } = props;
  const n = data.length;

  const geo = useMemo(
    () => polarClockGeometry({ values: data, size, inner, start, pad: 1, mode, now }),
    [data, size, inner, start, mode, now],
  );
  // The Chart viewBox gains a bottom gutter when the peak numeral is shown; the
  // clock still sits in the top square, so the pointer must map over the full height.
  const vbHeight = geo.size + (rest.label === "max" ? (rest.fontSize ?? 6) + 2 : 0);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const seg = useCallback(
    (i: number) => (formatSegment ? formatSegment(i, n) : defaultSegmentLabel(strings, i, n)),
    [formatSegment, n, strings],
  );
  const [active, setActive] = useState<number | null>(null); // data index

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : polarClockSummary(data, { formatSegment, strings, format, locale });
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (n === 0) return;
      const rct = e.currentTarget.getBoundingClientRect();
      if (rct.width === 0 || rct.height === 0) return;
      // Chart height may include a label gutter; the clock occupies the top square.
      const px = ((e.clientX - rct.left) / rct.width) * geo.size;
      const py = ((e.clientY - rct.top) / rct.height) * vbHeight;
      const dx = px - geo.size / 2;
      const dy = py - geo.size / 2;
      let ang = Math.atan2(dx, -dy); // 0 at 12 o'clock, clockwise
      if (ang < 0) ang += TAU;
      const pos = Math.min(n - 1, Math.floor((ang / TAU) * n));
      const index = (((pos + start) % n) + n) % n;
      setActive(index);
    },
    [geo, n, start, vbHeight],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (n === 0) return;
      const cur = active ?? -1;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = (((cur + 1) % n) + n) % n;
          break;
        case "ArrowLeft":
          next = (((cur - 1) % n) + n) % n;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = n - 1;
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
    [active, n],
  );

  const activeSeg = active !== null ? geo.segments[active] : undefined;
  const activeVal = active !== null ? data[active] : undefined;
  const overlayPath =
    activeSeg && !activeSeg.isNull
      ? annulusSector(
          geo.size / 2,
          geo.size / 2,
          activeSeg.rOuter,
          geo.guide.r,
          activeSeg.a0,
          activeSeg.a1,
        )
      : "";
  const announced =
    activeSeg !== undefined
      ? typeof activeVal === "number" && Number.isFinite(activeVal)
        ? strings.polarClockAt(seg(active!), fmt(activeVal))
        : strings.polarClockAt(seg(active!), "—")
      : "";
  const readout =
    activeSeg !== undefined
      ? `${seg(active!)}: ${typeof activeVal === "number" && Number.isFinite(activeVal) ? fmt(activeVal) : "—"}`
      : "";

  return (
    <span
      className="mc-polar-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticPolarClock
        {...rest}
        data={data}
        now={now}
        inner={inner}
        start={start}
        mode={mode}
        formatSegment={formatSegment}
        size={size}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {overlayPath ? <path d={overlayPath} data-mc-ink="accent" /> : null}
        {rest.children}
      </StaticPolarClock>
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
      {activeSeg !== undefined ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {readout}
        </span>
      ) : null}
    </span>
  );
}
