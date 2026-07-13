"use client";
// Interactive <BiasStrip>. One pointer listener; nearest pair by
// squared Euclidean distance over the precomputed dots. ←/→ step pairs ordered
// by mean, announcing the formatted mean, difference, and whether the pair falls
// outside the limits of agreement. Focus ring on the active dot. Composes the
// static component (canon).
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_BIAS_STRIP } from "../../core/strings-bias-strip.js";
import { biasLayout, biasStripGeometry } from "./geometry.js";
import { BiasStrip as StaticBiasStrip, biasStripSummary, type BiasStripProps } from "./index.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };

export interface InteractiveBiasStripProps extends BiasStripProps {
  /**
   * Opt-in entrance motion (default `false`): the pair dots settle onto the
   * plot on first client-side mount. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function BiasStrip(props: InteractiveBiasStripProps): React.ReactNode {
  const {
    data,
    limits = 1.96,
    width = 56,
    height = 30,
    format,
    locale,
    strings = EN_BIAS_STRIP,
    title,
    summary,
    animate = false,
    ...rest
  } = props;
  const { rad, outlierRad, captionPad } = biasLayout(width, height, props.label ?? "bias", props.r);

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "settle", animate, { selector: "circle" });

  const geo = useMemo(
    () => biasStripGeometry({ width, height, data, limits, rad: outlierRad, captionPad }),
    [width, height, data, limits, outlierRad, captionPad],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const fmtSigned = useMemo(
    () => makeFormatter(format, locale, { signDisplay: "exceptZero" }),
    [format, locale],
  );
  const [active, setActive] = useState<number | null>(null); // index into geo.dots

  /** Dots ordered by mean (x) for ←/→ stepping. */
  const order = useMemo(() => {
    const idx = geo.dots.map((d, i) => ({ i, x: d.x }));
    idx.sort((a, b) => a.x - b.x);
    return idx.map((e) => e.i);
  }, [geo]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : biasStripSummary(geo, strings, fmtSigned);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.dots.length === 0) return;
      const rct = e.currentTarget.getBoundingClientRect();
      if (rct.width === 0 || rct.height === 0) return;
      const x = ((e.clientX - rct.left) / rct.width) * width;
      const y = ((e.clientY - rct.top) / rct.height) * height;
      let best = 0;
      let bestDist = Infinity;
      geo.dots.forEach((d, i) => {
        const dist = (d.x - x) ** 2 + (d.y - y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    },
    [geo, width, height],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (order.length === 0) return;
      const pos = active === null ? -1 : order.indexOf(active);
      let next = pos;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(order.length - 1, pos + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, pos <= 0 ? 0 : pos - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = order.length - 1;
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      setActive(order[next]!);
    },
    [active, order],
  );

  const activeDot = active !== null ? geo.dots[active] : undefined;
  const activePair = activeDot ? data[activeDot.index] : undefined;
  const mean = activePair ? (activePair.a + activePair.b) / 2 : 0;
  const diff = activePair ? activePair.a - activePair.b : 0;
  const announced =
    activeDot && activePair
      ? strings.biasStripAt(
          activeDot.index + 1,
          data.length,
          fmt(mean),
          fmtSigned(diff),
          activeDot.outside ? strings.biasOutside : "",
        )
      : "";

  return (
    <span
      ref={hostRef}
      className="mc-bias-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticBiasStrip
        {...rest}
        data={data}
        limits={limits}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {activeDot ? (
          <circle
            cx={activeDot.x}
            cy={activeDot.y}
            r={(activeDot.outside ? outlierRad : rad) + 1.25}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticBiasStrip>
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
      {activeDot && activePair ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(activeDot.x / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${fmt(mean)}, ${fmtSigned(diff)}`}
        </span>
      ) : null}
    </span>
  );
}
