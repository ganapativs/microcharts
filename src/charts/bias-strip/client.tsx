"use client";
// Interactive <BiasStrip>. useActivePicker owns interaction: one pointer
// listener + nearest-pair-by-squared-Euclidean-distance math, ←/→ (and ↑/↓)
// step pairs ordered by mean, click / Enter / Space selects (onSelect).
// Unit = a plotted pair, so `datum.index` is the DOT POSITION in the displayed
// cloud — the geometry drops non-finite pairs and down-samples to ≤ 40 dots, so
// this equals the data index only for small, all-finite inputs (the pair's own
// data index stays in the announcement). `value` is the DIFFERENCE (a − b).
// encoded y channel; the pair's mean travels as `label`.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter, makePercentFormatter, makeUnitFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_BIAS_STRIP } from "../../core/strings-bias-strip.js";
import { biasLayout, biasStripGeometry } from "./geometry.js";
import { BiasStrip as StaticBiasStrip, biasStripSummary, type BiasStripProps } from "./index.js";
import {
  CHIP,
  named,
  fillFor,
  navOrder,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";

export interface InteractiveBiasStripProps extends BiasStripProps, PickerProps {
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
    readout = true,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;
  const { rad, outlierRad, captionPad } = biasLayout(width, height, props.label ?? "bias", props.r, props.labelSize);

  const hostRef = useRef<HTMLSpanElement>(null);
  // Dots settle in left→right along the mean axis (the same axis ←/→ nav
  // walks) — a gentle directional scan rather than an orderless sparkle.
  useEntrance(hostRef, "settle", animate, { selector: "circle", order: "x" });

  const geo = useMemo(
    () => biasStripGeometry({ width, height, data, limits, rad: outlierRad, captionPad }),
    [width, height, data, limits, outlierRad, captionPad],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const fmtSigned = useMemo(
    () => makeUnitFormatter(format, locale, { signDisplay: "exceptZero" }),
    [format, locale],
  );
  // Within-limits share — a percent of its own, so it takes `locale` but never
  // the value `format` (which carries the measurement's units).
  const pctFmt = useMemo(() => makePercentFormatter(locale), [locale]);

  /** Dots ordered by mean (x) for ←/→ stepping. */
  const order = useMemo(() => {
    const idx = geo.dots.map((d, i) => ({ i, x: d.x }));
    idx.sort((a, b) => a.x - b.x);
    return idx.map((e) => e.i);
  }, [geo]);

  const locate = useCallback(
    (x: number, y: number) => {
      if (geo.dots.length === 0) return null;
      let best = 0;
      let bestDist = Infinity;
      geo.dots.forEach((d, i) => {
        const dist = (d.x - x) ** 2 + (d.y - y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    },
    [geo],
  );

  // 1-D roving in mean order (not dot order): step in position space, then map back.
  const step = useCallback((cur: number, key: string) => navOrder(order, cur, key), [order]);

  const datum = useCallback(
    (i: number) => {
      const dot = geo.dots[i];
      const p = dot ? data[dot.index] : undefined;
      const mean = p ? (p.a + p.b) / 2 : 0;
      const diff = p ? p.a - p.b : 0;
      return {
        index: i,
        value: p ? diff : null,
        label: p ? fmt(mean) : undefined,
        formatted: p
          ? `${fmt(mean)}, ${fmtSigned(diff)}${dot!.outside ? strings.biasOutside : ""}`
          : undefined,
      };
    },
    [geo, data, fmt, fmtSigned, strings],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.dots.length,
    width,
    height,
    locate,
    datum,
    step,
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
        : biasStripSummary(geo, strings, fmtSigned, pctFmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const ring = (i: number, pinned: boolean) => {
    const d = geo.dots[i];
    if (!d) return null;
    return (
      <circle
        cx={d.x}
        cy={d.y}
        r={(d.outside ? outlierRad : rad) + 1.25}
        fill="none"
        data-mc-active=""
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const shownDot = shown !== null ? geo.dots[shown] : undefined;
  const shownPair = shownDot ? data[shownDot.index] : undefined;
  const mean = shownPair ? (shownPair.a + shownPair.b) / 2 : 0;
  const diff = shownPair ? shownPair.a - shownPair.b : 0;
  const announced =
    shownDot && shownPair
      ? strings.biasStripAt(
          shownDot.index + 1,
          data.length,
          fmt(mean),
          fmtSigned(diff),
          shownDot.outside ? strings.biasOutside : "",
        )
      : "";

  return (
    <span ref={hostRef} {...wrap("mc-bias-live", className, style)} {...named(label)} {...bind}>
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
        style={fillFor(style)}
      >
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticBiasStrip>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownDot && shownPair ? (
        <span className="mc-spark-readout" {...CHIP}>
          {`${fmt(mean)}, ${fmtSigned(diff)}${shownDot.outside ? strings.biasOutside : ""}`}
        </span>
      ) : null}
    </span>
  );
}
