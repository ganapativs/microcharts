"use client";
// Interactive <Seismogram> (plan/22 #8). One pointer listener; slot by x-band
// over the rendered series. ←/→ step slots, Home/End jump to first/last EVENT
// (not slot — quiet slots are skippable context). Announces via the shared
// point template; quiet slots use the pointEmpty wording (ActivityGrid
// parity). Composes the static component (canon).
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { maxPerBucket } from "../../core/downsample.js";
import { EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { EN_SLOTS, type SlotStrings } from "../../core/strings-slots.js";
import { EN_DIST, type DistStrings } from "../../core/strings-dist.js";
import { isFiniteValue } from "../../core/types.js";
import {
  Seismogram as StaticSeismogram,
  seismogramSummary,
  type SeismogramProps,
} from "./index.js";

export interface InteractiveSeismogramProps extends SeismogramProps {
  strings?: DistStrings;
  /** Slot announcement templates (shared point wording). */
  seriesStrings?: SeriesStrings & SlotStrings;
}

const DEFAULT_SERIES_STRINGS = { ...EN_SERIES, ...EN_SLOTS };

export function Seismogram(props: InteractiveSeismogramProps): React.ReactNode {
  const {
    data,
    mode = "intensity",
    domain,
    width = 60,
    height = 16,
    format,
    locale,
    strings = EN_DIST,
    seriesStrings = DEFAULT_SERIES_STRINGS,
    title,
    summary,
    ...rest
  } = props;

  // the rendered series (mirrors the static entry's downsampling)
  const rendered = useMemo(() => {
    const maxSlots = Math.max(1, Math.floor(width));
    return data.length > maxSlots ? maxPerBucket(data, maxSlots, { abs: true }) : [...data];
  }, [data, width]);

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : seismogramSummary(data, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (rendered.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const i = Math.floor(x / (width / rendered.length));
      setActive(i >= 0 && i < rendered.length ? i : null);
    },
    [rendered, width],
  );

  const eventSlots = useMemo(
    () =>
      rendered
        .map((v, i) => ({ v, i }))
        .filter((e) => isFiniteValue(e.v) && e.v !== 0)
        .map((e) => e.i),
    [rendered],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (rendered.length === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(rendered.length - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = eventSlots[0] ?? 0;
          break;
        case "End":
          next = eventSlots[eventSlots.length - 1] ?? rendered.length - 1;
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
    [active, rendered, eventSlots],
  );

  const activeValue = active !== null ? rendered[active] : undefined;
  const announced =
    active === null
      ? ""
      : isFiniteValue(activeValue) && activeValue !== 0
        ? seriesStrings.point(active + 1, rendered.length, fmt(activeValue))
        : seriesStrings.pointEmpty(active + 1, rendered.length);

  const slotW = rendered.length > 0 ? width / rendered.length : 0;

  return (
    <span
      className="mc-seismo-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticSeismogram
        {...rest}
        data={data}
        mode={mode}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {active !== null ? (
          <line
            x1={slotW * (active + 0.5)}
            y1={0}
            x2={slotW * (active + 0.5)}
            y2={height}
            data-mc-ink="muted"
            vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: 1 }}
          />
        ) : null}
        {rest.children}
      </StaticSeismogram>
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
      {active !== null ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((slotW * (active + 0.5)) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {isFiniteValue(activeValue) && activeValue !== 0 ? fmt(activeValue) : "—"}
        </span>
      ) : null}
    </span>
  );
}
