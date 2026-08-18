"use client";
// Interactive <CometTrail>. Motion only on data change — no idle
// loop: the head EASES to each new value (WAAPI transform, ~200 ms) and the old
// head decays into the trail. A continuous stream makes the comet; a stalled
// stream goes still, which is itself the signal. The dot jumps to truth, eased,
// never simulated between updates. Reduced-motion → instant reposition (the static
// encoding is already complete). useActivePicker owns interaction: one pointer
// listener + nearest-point-by-x math, ←/→ walk the trail (left = older, right =
// newer). click / Enter / Space selects (onSelect). The shown point's value
// rides in a floating chip over its dot (`readout={false}` suppresses only
// chip).
import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePrefersReducedMotion, useInViewport } from "../../shared/motion.js";
import {
  CHIP,
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { lastFinite } from "../../core/stats.js";
import { EN_COMET_TRAIL, type CometTrailStrings } from "../../core/strings-comet-trail.js";
import { LiveRegion } from "../../shared/live-region.js";
import { cometLabelBand, cometTrailGeometry, DEFAULT_TRAIL } from "./geometry.js";
import {
  CometTrail as StaticCometTrail,
  cometTrailSummary,
  type CometTrailProps,
} from "./index.js";

export interface InteractiveCometTrailProps extends CometTrailProps, PickerProps {
  strings?: CometTrailStrings;
}

/** Focus / pinned-selection ring around a shown point. */
const ring = (m: { cx: number; cy: number; r: number }, pinned: boolean) => (
  <circle
    cx={m.cx}
    cy={m.cy}
    r={m.r + 1.5}
    fill="none"
    data-mc-active=""
    data-mc-w={pinned ? "tick" : "support"}
  />
);

export function CometTrail(props: InteractiveCometTrailProps): React.ReactNode {
  const {
    data,
    trail = DEFAULT_TRAIL,
    label = "last",
    domain,
    width = 60,
    height = 16,
    format,
    locale,
    strings = EN_COMET_TRAIL,
    title,
    summary,
    className,
    style,
    readout = true,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;
  // Same NaN/0 guard as the static entry — the two must resolve the identical
  // font size or the composed frame and the overlays part company.
  const asked = props.fontSize ?? labelFont(height, 0.55, props.labelSize);
  const fontSize =
    Number.isFinite(asked) && asked > 0 ? asked : labelFont(height, 0.55, props.labelSize);

  const reduced = usePrefersReducedMotion();
  const [wrapRef, inView] = useInViewport<HTMLSpanElement>();
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Same three lines as the static entry, off the same shared resolver: the
  // gutter decides the plot width, so computing it differently here would drift
  // every overlay off the dots it is meant to ring.
  const labelBand = useMemo(() => {
    const last = lastFinite(data);
    return cometLabelBand(
      label === "last" && last !== undefined ? fmt(last) : null,
      fontSize,
      width,
      height,
    );
  }, [data, label, fmt, fontSize, width, height]);
  const geo = useMemo(
    () =>
      cometTrailGeometry({
        values: data,
        width: width - labelBand,
        height,
        domain,
        trail,
        pad: 1,
        // Mirrors the static entry exactly — omitting vPad would compute a
        // different y scale than the SVG being composed and drift the overlays.
        vPad: labelBand > 0 ? fontSize * 0.6 : 0,
      }),
    [data, width, labelBand, height, domain, trail, fontSize],
  );
  const prevHead = useRef<{ cx: number; cy: number } | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : cometTrailSummary(data, { trail, strings, format, locale });
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // Ease the head to its new position on each data change (transform, not layout).
  useEffect(() => {
    const head = wrapRef.current?.querySelector<SVGCircleElement>(".mc-comet-head");
    if (!head || !geo.head) {
      prevHead.current = geo.head ? { cx: geo.head.cx, cy: geo.head.cy } : null;
      return;
    }
    const prev = prevHead.current;
    prevHead.current = { cx: geo.head.cx, cy: geo.head.cy };
    if (!prev || reduced || !inView) return;
    const dx = prev.cx - geo.head.cx;
    const dy = prev.cy - geo.head.cy;
    if (dx === 0 && dy === 0) return;
    head.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0px, 0px)" }],
      { duration: 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
  }, [geo, reduced, inView, wrapRef]);

  // Unit = one SHOWN point, in visual left→right order: 0 = oldest point in the
  // window, count-1 = the head (now). `geo.trail` is newest-first, so it is
  // walked backwards. Not the data index — the window keeps only the last
  // `trail + 1` finite values.
  const marks = useMemo(() => {
    const out: { cx: number; cy: number; r: number }[] = [];
    for (let k = geo.trail.length - 1; k >= 0; k--) {
      const t = geo.trail[k]!;
      out.push({ cx: t.cx, cy: t.cy, r: t.r });
    }
    if (geo.head) out.push({ cx: geo.head.cx, cy: geo.head.cy, r: geo.head.r });
    return out;
  }, [geo]);

  // The values behind those marks, same order (non-finite entries are dropped
  // by the geometry, so the window is taken over the finite values).
  const shownValues = useMemo(() => {
    const finite = data.filter((v) => Number.isFinite(v));
    return finite.slice(finite.length - marks.length);
  }, [data, marks.length]);

  const locate = useCallback(
    (x: number) => {
      if (marks.length === 0) return null;
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < marks.length; i++) {
        const d = Math.abs(marks[i]!.cx - x);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    },
    [marks],
  );

  // value = the point's value.
  const datum = useCallback(
    (i: number) => ({
      index: i,
      value: shownValues[i] ?? null,
      formatted: shownValues[i] == null ? "" : fmt(shownValues[i]!),
    }),
    [shownValues, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: marks.length,
    width,
    height: geo.height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const shown = active ?? selected;
  const shownMark = shown !== null ? marks[shown] : undefined;
  const shownValue = shown !== null ? shownValues[shown] : undefined;
  const pinMark = selected !== null && selected !== active ? marks[selected] : undefined;
  // Age in updates: the head is "now", every earlier point is k updates ago.
  const announced =
    shownMark && shownValue !== undefined
      ? shown === marks.length - 1
        ? strings.cometTrailNow(fmt(shownValue))
        : strings.cometTrailAt(marks.length - 1 - shown!, fmt(shownValue))
      : "";

  return (
    <span
      ref={wrapRef}
      {...wrap("mc-comet-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticCometTrail
        {...rest}
        style={fillFor(style)}
        data={data}
        trail={trail}
        label={label}
        domain={domain}
        width={width}
        height={height}
        fontSize={fontSize}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {pinMark ? ring(pinMark, true) : null}
        {active !== null && marks[active] ? ring(marks[active]!, false) : null}
        {rest.children}
      </StaticCometTrail>
      <LiveRegion>{announced}</LiveRegion>
      {/* The head's value is already printed by `label="last"`, and the chip
          would land on top of that numeral — skip it there (SparkLine's rule),
          and read out every earlier point in the trail. Gated on the RESERVED
          gutter, not on the prop: a numeral that dropped for want of room isn't
          printing anything for the chip to collide with. */}
      {readout &&
      shownMark &&
      shownValue !== undefined &&
      Number.isFinite(shownValue) &&
      !(labelBand > 0 && shown === marks.length - 1) ? (
        <span className="mc-spark-readout" {...CHIP}>
          {fmt(shownValue)}
        </span>
      ) : null}
    </span>
  );
}
