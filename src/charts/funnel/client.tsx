"use client";
// Interactive <Funnel> (plan/22 #19). One pointer listener; stage by x-band.
// ←/→ rove stages ("Checkout: 2,730 — 22% of visitors."). Composes the static.
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { isFiniteValue } from "../../core/types.js";
import { funnelGeometry } from "./geometry.js";
import { Funnel as StaticFunnel, funnelSummary, type FunnelProps } from "./index.js";

export interface InteractiveFunnelProps extends FunnelProps {
  strings?: CompositionStrings;
}

export function Funnel(props: InteractiveFunnelProps): React.ReactNode {
  const {
    data,
    mode = "absolute",
    connectors = true,
    label = "none",
    width = 60,
    height = 18,
    format,
    locale,
    strings = EN_COMPOSITION,
    title,
    summary,
    ...rest
  } = props;

  const geo = useMemo(
    () =>
      funnelGeometry({
        width,
        height,
        values: data.map((d) => d.value),
        mode,
        connectors,
        fontSize: label === "none" ? 0 : 5,
      }),
    [width, height, data, mode, connectors, label],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const pctFmt = useMemo(
    () => makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 }),
    [format, locale],
  );
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : funnelSummary(data, fmt, pctFmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.stages.length === 0 || geo.pitch === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const i = Math.floor(x / geo.pitch);
      setActive(i >= 0 && i < geo.stages.length ? i : null);
    },
    [geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.stages.length === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(geo.stages.length - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.stages.length - 1;
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

  const st = active !== null ? geo.stages[active] : undefined;
  const datum = st ? data[st.index] : undefined;
  const firstLabel = data[0]?.label ?? "";
  const announced =
    st && datum && isFiniteValue(datum.value)
      ? strings.stageAt(datum.label, fmt(datum.value), pctFmt(st.share), firstLabel)
      : datum
        ? `${datum.label}: ${strings.noData}`
        : "";

  return (
    <span
      className="mc-funnel-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticFunnel
        {...rest}
        data={data}
        mode={mode}
        connectors={connectors}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {st ? (
          <rect
            x={st.x - 0.5}
            y={-0.5}
            width={st.w + 1}
            height={height + 1}
            fill="none"
            stroke="var(--mc-accent)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticFunnel>
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
      {st && datum && isFiniteValue(datum.value) ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((st.x + st.w / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${datum.label} ${pctFmt(st.share)}`}
        </span>
      ) : null}
    </span>
  );
}
