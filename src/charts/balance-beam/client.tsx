"use client";
// Interactive <BalanceBeam>. useActivePicker owns interaction: one pointer
// listener + nearest-half lookup, ←/→ focus a PAN, click / Enter / Space
// selects it (onSelect); the beam eases to a new tilt on data change (CSS
// geometry transition, reduced-motion-gated) and announces when the heavier
// side flips.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
import { labelFont } from "../../core/labels.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { balanceBeamGeometry, DEFAULT_MAX_TILT } from "./geometry.js";
import { EN_BEAM, type BeamStrings } from "../../core/strings-beam.js";
import { BalanceBeam as StaticBeam, balanceBeamSummary, type BalanceBeamProps } from "./index.js";

export interface InteractiveBalanceBeamProps extends BalanceBeamProps, PickerProps {
  live?: boolean;
  strings?: BeamStrings;
  /**
   * Opt-in entrance motion (default `false`): the two weights settle onto
   * the beam on first client-side mount. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins. Independent of the
   * beam's own live-retilt CSS transition (that eases geometry attributes on
   * data change; this animates transform/opacity on mount — no overlap).
   */
  animate?: boolean;
}

const PAD = 2;

export function BalanceBeam(props: InteractiveBalanceBeamProps): React.ReactNode {
  const {
    live = true,
    strings = EN_BEAM,
    title,
    data,
    mode = "ratio",
    shape = "square",
    domain,
    maxTilt = DEFAULT_MAX_TILT,
    width = 48,
    height = 20,
    format,
    locale,
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
  const text = balanceBeamSummary(data, { mode, domain, strings, format, locale });
  // Data-driven announcement: fires only when the heavier side flips (a prop
  // change), independent of keyboard/pointer focus — see `panSpoken` below for
  // the roving announcement, which takes priority whenever a pan is shown.
  const [changed, setChanged] = useState("");
  const hostRef = useRef<HTMLSpanElement>(null);
  // Only the weights (dots) settle — the beam and fulcrum arrive via the base
  // whole-svg fade, since a scaling line/path would read oddly at this scale.
  useEntrance(hostRef, "settle", animate, {
    selector: '[data-mc-ink="accent"], [data-mc-ink="point"]',
  });

  // Same inputs as the static render (pure → identical numbers), so the focus
  // and pin rings sit exactly on the drawn weights.
  const geo = useMemo(
    () =>
      balanceBeamGeometry({
        a: data[0]?.value,
        b: data[1]?.value,
        width,
        height,
        maxTilt,
        mode,
        domain,
        pad: PAD,
      }),
    [data, width, height, maxTilt, mode, domain],
  );

  const prevHeavier = useRef(geo.heavier);
  useEffect(() => {
    if (geo.heavier === prevHeavier.current) return;
    prevHeavier.current = geo.heavier;
    if (live) setChanged(text);
  }, [geo, text, live]);

  // The caller's `summary` owns the wrapper's name: `false` is the decorative
  // opt-out (`named()` renders `aria-hidden` and drops the tab stop with it), a
  // string replaces the generated sentence. The generated text stays what the
  // live region announces on a value change.
  const accName =
    props.summary === false ? undefined : typeof props.summary === "string" ? props.summary : text;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // The navigable unit is the PAN (a side of the beam), 1:1 with `data`:
  // 0 = left, 1 = right. `value` = that pan's weight (the area-true mark).
  const locate = useCallback((x: number) => (x < width / 2 ? 0 : 1), [width]);
  const datum = useCallback(
    (i: number) => {
      const v = data[i]?.value;
      return {
        index: i,
        value: v ?? null,
        label: data[i]?.label,
        formatted: isFiniteValue(v) ? `${data[i]?.label} ${fmt(v)}` : undefined,
      };
    },
    [data, fmt],
  );
  // Two pans read as places, not as a sequence: ← always means the LEFT pan and
  // → the RIGHT one (the pre-migration behaviour), so the arrows are absolute
  // rather than relative and never fall through to the 1-D default.
  const step = useCallback((_cur: number, key: string) => {
    switch (key) {
      case "ArrowLeft":
      case "ArrowUp":
      case "Home":
        return 0;
      case "ArrowRight":
      case "ArrowDown":
      case "End":
        return 1;
    }
    return null;
  }, []);

  // The static reserves a value gutter BELOW the apparatus, so the rendered
  // viewBox is `height + labelBand` — the pointer map has to use the total.
  const labelBand =
    (props.label ?? "none") === "values"
      ? Math.ceil((props.fontSize ?? labelFont(height, 0.4)) * 1.3)
      : 0;

  const { active, selected, bind } = useActivePicker({
    count: 2,
    width,
    height: height + labelBand,
    locate,
    datum,
    step,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const ring = (i: number, pinned: boolean) => {
    const w = geo.weights[i];
    // No weight is drawn for an unknown pan, so there is nothing to ring.
    if (!w || !geo.known[i]) return null;
    const common = {
      fill: "none",
      "data-mc-active": "",
      "data-mc-w": pinned ? "tick" : "support",
      vectorEffect: "non-scaling-stroke" as const,
    };
    return shape === "round" ? (
      <circle cx={w.cx} cy={w.cy} r={w.half + 1.5} {...common} />
    ) : (
      <rect
        x={w.cx - w.half - 1.5}
        y={w.cy - w.half - 1.5}
        width={w.half * 2 + 3}
        height={w.half * 2 + 3}
        {...common}
      />
    );
  };

  const shown = active ?? selected;
  const pan = shown !== null ? data[shown] : undefined;
  // What the live region says while roving: the currently-shown pan (hover or
  // keyboard focus), read the same way the visible readout chip shows it. This
  // takes priority over `changed` so arrowing between the two pans is always
  // announced, not just prop-driven data changes.
  // An unknown pan has nothing to read out — never format a null.
  const panKnown = pan !== undefined && isFiniteValue(pan.value);
  const panSpoken = pan
    ? panKnown
      ? strings.beamPanAt(pan.label, fmt(pan.value))
      : strings.noData
    : "";
  const announced = shown !== null ? panSpoken : changed;

  return (
    <span ref={hostRef} {...wrap("mc-beam-live", className, style)} {...named(label)} {...bind}>
      <StaticBeam
        {...rest}
        style={fillFor(style)}
        data={data}
        mode={mode}
        shape={shape}
        domain={domain}
        maxTilt={maxTilt}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticBeam>
      <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
      {readout && panKnown ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {`${pan!.label} ${fmt(pan!.value)}`}
        </span>
      ) : null}
    </span>
  );
}
