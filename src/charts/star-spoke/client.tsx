"use client";
// Interactive <StarSpoke>. useActivePicker owns interaction: one pointer
// listener + nearest-spoke-by-angle lookup (atan2, pure). ←/→/↑/↓ rotate focus
// circularly through the spokes, click / Enter / Space selects (onSelect).
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
import { labelFont } from "../../core/labels.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_STAR_SPOKE } from "../../core/strings-star-spoke.js";
import { UNIT_DOMAIN, starSpokeGeometry } from "./geometry.js";
import { StarSpoke as StaticStarSpoke, starSpokeSummary, type StarSpokeProps } from "./index.js";

export interface InteractiveStarSpokeProps extends StarSpokeProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): the shape draws on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function StarSpoke(props: InteractiveStarSpokeProps): React.ReactNode {
  const {
    data,
    domain = UNIT_DOMAIN,
    size = 80,
    labels = true,
    format,
    locale,
    strings = EN_STAR_SPOKE,
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

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "draw", animate);

  // Mirror the static entry's label ring EXACTLY — a divergent `pad` shifts
  // every spoke, and the focus mark would sit off the drawn spoke.
  const showLabels = labels && size >= 44;
  const pad = showLabels ? Math.max(labelFont(size, 0.1) * 2, size * 0.22) : 2;
  const geo = useMemo(
    () =>
      starSpokeGeometry({
        values: data.map((d) => d.value),
        domain,
        width: size,
        height: size,
        pad,
      }),
    [data, domain, size, pad],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const n = data.length;

  // Pointer (viewBox space) → spoke index by cursor angle (screen angle; the
  // geometry seats spoke 0 at 12 o'clock and runs clockwise). The hub is a dead
  // zone — near the center no spoke direction is meaningful.
  const locate = useCallback(
    (x: number, y: number) => {
      if (n === 0) return null;
      const px = x - size / 2;
      const py = y - size / 2;
      if (Math.hypot(px, py) < size * 0.06) return null;
      const a = Math.atan2(py, px);
      let i = Math.round((a + Math.PI / 2) / ((2 * Math.PI) / n)) % n;
      if (i < 0) i += n;
      return i;
    },
    [n, size],
  );

  // Circular roving: the spokes are a ring, so all four arrows wrap around it
  // (as the pre-kernel client did). Nothing active → the first arrow lands on
  // spoke 0.
  const step = useCallback(
    (cur: number, key: string) => {
      if (n === 0) return null;
      switch (key) {
        case "ArrowRight":
        case "ArrowDown":
          return cur < 0 ? 0 : (cur + 1) % n;
        case "ArrowLeft":
        case "ArrowUp":
          return cur < 0 ? 0 : (cur - 1 + n) % n;
        case "Home":
          return 0;
        case "End":
          return n - 1;
      }
      return null;
    },
    [n],
  );

  // index = data index (one spoke per metric); value = that spoke's value;
  // label = the axis/spoke name.
  const datum = useCallback(
    (i: number) => {
      const d = data[i];
      return {
        index: i,
        value: d && Number.isFinite(d.value) ? d.value : null,
        label: d?.label,
        formatted: d ? `${d.label} ${isFiniteValue(d.value) ? fmt(d.value) : "—"}` : undefined,
      };
    },
    [data, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: n,
    width: size,
    height: size,
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
        : starSpokeSummary(data, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const mark = (i: number, pinned: boolean) => {
    const s = geo.spokes[i];
    if (!s) return null;
    return (
      <>
        <line
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke="var(--mc-accent)"
          strokeLinecap="round"
          data-mc-w={pinned ? "tick" : "support"}
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={s.tx} cy={s.ty} r={Math.max(1, size * 0.05)} fill="var(--mc-accent)" />
      </>
    );
  };

  const shown = active ?? selected;
  const spoke = shown !== null ? geo.spokes[shown] : undefined;
  const shownDatum = shown !== null ? data[shown] : undefined;
  const announced = shownDatum
    ? isFiniteValue(shownDatum.value)
      ? strings.spokeAt(shownDatum.label, fmt(shownDatum.value))
      : strings.spokeEmpty(shownDatum.label)
    : "";

  return (
    <span ref={hostRef} {...wrap("mc-star-live", className, style)} {...named(label)} {...bind}>
      <StaticStarSpoke
        {...rest}
        data={data}
        domain={domain}
        size={size}
        labels={labels}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {selected !== null && selected !== active ? mark(selected, true) : null}
        {active !== null ? mark(active, false) : null}
        {rest.children}
      </StaticStarSpoke>
      <LiveRegion>{announced}</LiveRegion>
      {readout && spoke && shownDatum ? (
        <span
          className="mc-spark-readout"
          style={{
            ...crosshairReadoutStyle(spoke.tx, size),
            top: `${(spoke.ty / size) * 100}%`,
            transform: "translate(-50%, -140%)",
            bottom: "auto",
          }}
        >
          {`${shownDatum.label} ${isFiniteValue(shownDatum.value) ? fmt(shownDatum.value) : "—"}`}
        </span>
      ) : null}
    </span>
  );
}
